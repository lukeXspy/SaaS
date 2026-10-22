/**
 * Migração: data URLs → Supabase Storage
 *
 * Processo:
 * 1. Busca Attachment com storagePath LIKE 'data:%'
 * 2. Busca WorkOrderExecution com signatureUrl LIKE 'data:%'
 * 3. Para cada registro: decodifica → uploada → atualiza DB
 *
 * Idempotente: registros que NÃO começam com 'data:' são pulados.
 * Preserva o original: o DB só é atualizado APÓS o upload confirmar.
 *
 * Path determinístico: usa o ID do registro como nome do arquivo.
 * Re-executar não duplica arquivos (mesmo path para o mesmo registro).
 *
 * Uso: npx tsx scripts/migrate-media.ts
 * Requer: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL no .env
 */

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "manutenza-media";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.");
  console.error("   Preencha no .env antes de rodar a migração.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function decodeDataUrl(dataUrl: string): { buffer: Buffer; mime: string } | null {
  const match = dataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/);
  const mime = match?.[1];
  const base64 = match?.[2];
  if (!mime || !base64) return null;
  try {
    return {
      buffer: Buffer.from(base64, "base64"),
      mime,
    };
  } catch {
    return null;
  }
}

function extForMime(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}

/**
 * Path determinístico: usa o ID do registro.
 * Re-executar produz o mesmo path — não duplica arquivos.
 */
function deterministicPath(
  companyId: string,
  type: "work-orders" | "inspections" | "signatures" | "assets",
  entityId: string,
  recordId: string,
  ext: string,
): string {
  return `${companyId}/${type}/${entityId}/${recordId}.${ext}`;
}

async function uploadToStorage(
  path: string,
  buffer: Buffer,
  mimeType: string,
): Promise<boolean> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: mimeType, upsert: true });

  if (error) {
    console.error(`   ❌ Upload falhou: ${error.message}`);
    return false;
  }
  return true;
}

// ─────────────────────────────────────────────────────────────
// Migração de Attachments (fotos)
// ─────────────────────────────────────────────────────────────

async function migrateAttachments(): Promise<{ migrated: number; skipped: number; failed: number }> {
  console.log("\n📎 Migrando Attachment (fotos)…");

  const attachments = await prisma.attachment.findMany({
    where: { storagePath: { startsWith: "data:" } },
    select: {
      id: true,
      companyId: true,
      storagePath: true,
      workOrderId: true,
      inspectionId: true,
      inspectionResponseId: true,
      assetId: true,
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`   Encontrados: ${attachments.length} registro(s) com data URL`);

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const att of attachments) {
    const decoded = decodeDataUrl(att.storagePath);
    if (!decoded) {
      console.warn(`   ⚠️  [${att.id}] Data URL inválida — pulando`);
      skipped++;
      continue;
    }

    // Determina o path baseado no tipo de vínculo
    let type: "work-orders" | "inspections" | "assets";
    let entityId: string;

    if (att.workOrderId) {
      type = "work-orders";
      entityId = att.workOrderId;
    } else if (att.inspectionId || att.inspectionResponseId) {
      type = "inspections";
      entityId = att.inspectionId ?? att.inspectionResponseId!;
    } else if (att.assetId) {
      type = "assets";
      entityId = att.assetId;
    } else {
      console.warn(`   ⚠️  [${att.id}] Sem vínculo — usando companyId como fallback`);
      type = "assets";
      entityId = att.companyId;
    }

    const ext = extForMime(decoded.mime);
    const path = deterministicPath(att.companyId, type, entityId, att.id, ext);

    // 1. Upload primeiro (preserva o original no DB)
    const uploaded = await uploadToStorage(path, decoded.buffer, decoded.mime);
    if (!uploaded) {
      failed++;
      continue; // DB continua com data URL — seguro tentar de novo
    }

    // 2. Só atualiza o DB após confirmar o upload
    try {
      await prisma.attachment.update({
        where: { id: att.id },
        data: { storagePath: path },
      });
      migrated++;
      console.log(`   ✅ [${att.id}] → ${path}`);
    } catch (err) {
      // Upload ok mas DB falhou — arquivo existe no Storage, DB tem data URL.
      // Próxima execução vai re-upar (upsert=true) e tentar atualizar de novo.
      console.error(`   ❌ [${att.id}] DB update falhou: ${err}`);
      failed++;
    }
  }

  return { migrated, skipped, failed };
}

// ─────────────────────────────────────────────────────────────
// Migração de WorkOrderExecution (assinaturas)
// ─────────────────────────────────────────────────────────────

async function migrateSignatures(): Promise<{ migrated: number; skipped: number; failed: number }> {
  console.log("\n✍️  Migrando WorkOrderExecution (assinaturas)…");

  const executions = await prisma.workOrderExecution.findMany({
    where: { signatureUrl: { startsWith: "data:" } },
    select: {
      id: true,
      companyId: true,
      workOrderId: true,
      signatureUrl: true,
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`   Encontrados: ${executions.length} registro(s) com data URL`);

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const exec of executions) {
    if (!exec.signatureUrl) {
      skipped++;
      continue;
    }

    const decoded = decodeDataUrl(exec.signatureUrl);
    if (!decoded) {
      console.warn(`   ⚠️  [${exec.id}] Data URL inválida — pulando`);
      skipped++;
      continue;
    }

    const ext = extForMime(decoded.mime);
    const path = deterministicPath(
      exec.companyId,
      "signatures",
      exec.workOrderId,
      exec.id,
      ext,
    );

    // 1. Upload primeiro
    const uploaded = await uploadToStorage(path, decoded.buffer, decoded.mime);
    if (!uploaded) {
      failed++;
      continue;
    }

    // 2. Atualiza DB após confirmar
    try {
      await prisma.workOrderExecution.update({
        where: { id: exec.id },
        data: { signatureUrl: path },
      });
      migrated++;
      console.log(`   ✅ [${exec.id}] → ${path}`);
    } catch (err) {
      console.error(`   ❌ [${exec.id}] DB update falhou: ${err}`);
      failed++;
    }
  }

  return { migrated, skipped, failed };
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Migração de mídia: data URLs → Supabase Storage");
  console.log(`   Bucket: ${BUCKET}`);
  console.log(`   URL: ${SUPABASE_URL}`);

  // Verifica que o bucket existe
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  if (bucketError) {
    console.error("❌ Não foi possível listar buckets:", bucketError.message);
    process.exit(1);
  }
  const bucketExists = buckets?.some((b) => b.name === BUCKET);
  if (!bucketExists) {
    console.error(`❌ Bucket "${BUCKET}" não existe. Crie-o primeiro:`);
    console.error(`   INSERT INTO storage.buckets (id, name, public)`);
    console.error(`   VALUES ('${BUCKET}', '${BUCKET}', false);`);
    process.exit(1);
  }
  console.log(`   ✅ Bucket "${BUCKET}" encontrado`);

  const attResult = await migrateAttachments();
  const sigResult = await migrateSignatures();

  console.log("\n📊 Resumo:");
  console.log(`   Fotos:      ${attResult.migrated} migradas, ${attResult.skipped} puladas, ${attResult.failed} falharam`);
  console.log(`   Assinaturas: ${sigResult.migrated} migradas, ${sigResult.skipped} puladas, ${sigResult.failed} falharam`);

  if (attResult.failed > 0 || sigResult.failed > 0) {
    console.log("\n⚠️  Alguns registros falharam. Re-executar é seguro (idempotente).");
    process.exit(1);
  }

  console.log("\n✅ Migração concluída com sucesso.");
}

main()
  .catch((err) => {
    console.error("❌ Erro fatal:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });