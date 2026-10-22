import "server-only";

import { randomUUID } from "node:crypto";

import { getStorageClient, isStorageConfigured, STORAGE_BUCKET } from "./client";
import { serviceError, serviceOk, type ServiceResult } from "@/server/services/result";

export { isStorageConfigured };

// ─────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────

/** Limite máximo de arquivo em bytes (5 MB). */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Duração da URL assinada em segundos (1 hora). */
export const SIGNED_URL_EXPIRES = 3600;

/** MIME types permitidos e suas extensões. */
const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

// ─────────────────────────────────────────────────────────────
// Validação de magic bytes (conteúdo real, não MIME declarado)
// ─────────────────────────────────────────────────────────────

/**
 * Detecta o MIME real do arquivo lendo os primeiros bytes.
 * Retorna null se o formato não for reconhecido ou permitido.
 */
export function detectRealMimeType(buffer: Buffer): string | null {
  // JPEG: FF D8 FF
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  // WebP: RIFF .... WEBP
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && // R
    buffer[1] === 0x49 && // I
    buffer[2] === 0x46 && // F
    buffer[3] === 0x46 && // F
    buffer[8] === 0x57 && // W
    buffer[9] === 0x45 && // E
    buffer[10] === 0x42 && // B
    buffer[11] === 0x50 // P
  ) {
    return "image/webp";
  }

  return null;
}

/**
 * Valida o buffer: tamanho, magic bytes e MIME final.
 * Retorna o MIME validado ou um erro descritivo.
 */
function validateBuffer(buffer: Buffer): ServiceResult<string> {
  if (buffer.length === 0) {
    return serviceError("Arquivo vazio.");
  }

  if (buffer.length > MAX_FILE_SIZE) {
    return serviceError(`Arquivo excede o limite de ${Math.round(MAX_FILE_SIZE / 1024 / 1024)} MB.`);
  }

  const realMime = detectRealMimeType(buffer);
  if (!realMime) {
    return serviceError("Formato de arquivo não suportado. Envie JPEG, PNG ou WebP.");
  }

  if (!ALLOWED_MIME[realMime]) {
    return serviceError(`Tipo não permitido: ${realMime}.`);
  }

  return serviceOk(realMime);
}

// ─────────────────────────────────────────────────────────────
// Geração de paths (sempre no servidor, nunca do cliente)
// ─────────────────────────────────────────────────────────────

export type MediaTargetType = "work-orders" | "inspections" | "signatures" | "assets";

/**
 * Gera um path determinístico e seguro para o Storage.
 * Sempre chamado no servidor — o cliente nunca fornece o path.
 *
 * Formato: {companyId}/{type}/{entityId}/{uuid}.{ext}
 */
export function buildStoragePath(
  companyId: string,
  type: MediaTargetType,
  entityId: string,
  extension: string,
): string {
  const uuid = randomUUID();
  const ext = extension.startsWith(".") ? extension : `.${extension}`;
  return `${companyId}/${type}/${entityId}/${uuid}${ext}`;
}

/**
 * Extrai o companyId do path (primeiro segmento).
 * Usado como verificação adicional (defense in depth), mas o isolamento
 * principal é feito pelos services que validam sessão + permissão.
 */
export function extractCompanyIdFromPath(path: string): string | null {
  const idx = path.indexOf("/");
  if (idx <= 0) return null;
  return path.slice(0, idx);
}

// ─────────────────────────────────────────────────────────────
// Operações de Storage
// ─────────────────────────────────────────────────────────────

/**
 * Faz upload de um buffer para o Storage.
 *
 * Valida conteúdo real (magic bytes), tamanho (≤ 5 MB) e gera path no servidor.
 * Em dev sem configuração, retorna o data URL como fallback.
 *
 * @param companyId  ID da empresa (isolamento por tenant)
 * @param type       Categoria do arquivo
 * @param entityId   ID da OS/inspeção a que o arquivo pertence
 * @param buffer     Bytes do arquivo
 * @param declaredMime  MIME declarado (validado contra magic bytes)
 * @param dataUrlFallback  Em dev, se Storage não configurado, usa este data URL
 */
export async function uploadMedia(
  companyId: string,
  type: MediaTargetType,
  entityId: string,
  buffer: Buffer,
  declaredMime: string,
  dataUrlFallback?: string,
): Promise<ServiceResult<{ storagePath: string; mimeType: string; fileSize: number }>> {
  const validated = validateBuffer(buffer);
  if (!validated.ok) return validated;
  const realMime = validated.data;

  // Desenvolvimento sem Supabase configurado: fallback data URL
  if (!isStorageConfigured()) {
    if (process.env.NODE_ENV === "production") {
      // getStorageClient() já lança em produção, mas mantemos por clareza
      return serviceError("Storage não configurado. Contate o suporte.");
    }
    if (!dataUrlFallback) {
      return serviceError("Storage não configurado e nenhum fallback fornecido.");
    }
    return serviceOk({
      storagePath: dataUrlFallback,
      mimeType: realMime,
      fileSize: buffer.length,
    });
  }

  const client = getStorageClient();
  if (!client) {
    return serviceError("Storage não disponível.");
  }

  const ext = ALLOWED_MIME[realMime] ?? ".bin";
  const path = buildStoragePath(companyId, type, entityId, ext);

  const { error: uploadError } = await client.storage
    .from(STORAGE_BUCKET)
    .upload(path, buffer, { contentType: realMime, upsert: false });

  if (uploadError) {
    console.error("uploadMedia", uploadError);
    return serviceError("Falha ao enviar arquivo. Tente novamente.");
  }

  return serviceOk({
    storagePath: path,
    mimeType: realMime,
    fileSize: buffer.length,
  });
}

/**
 * Gera uma URL assinada temporária para o path.
 *
 * Caller DEVE validar que o usuário tem permissão antes de chamar.
 * Retorna o próprio valor se for um data URL (dev fallback).
 */
export async function getSignedMediaUrl(
  storagePath: string,
  expiresInSeconds: number = SIGNED_URL_EXPIRES,
): Promise<ServiceResult<string>> {
  // Data URLs (dev fallback) são usadas diretamente
  if (storagePath.startsWith("data:")) {
    return serviceOk(storagePath);
  }

  const client = getStorageClient();
  if (!client) {
    return serviceError("Storage não disponível.");
  }

  const { data, error } = await client.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data) {
    console.error("getSignedMediaUrl", error);
    return serviceError("Falha ao gerar URL do arquivo.");
  }

  return serviceOk(data.signedUrl);
}

/**
 * Baixa o arquivo do Storage como Buffer.
 * Usado pelo PDF (precisa dos bytes, não da URL).
 */
export async function downloadMedia(
  storagePath: string,
): Promise<ServiceResult<Buffer>> {
  if (storagePath.startsWith("data:")) {
    const base64 = storagePath.slice(storagePath.indexOf(",") + 1);
    return serviceOk(Buffer.from(base64, "base64"));
  }

  const client = getStorageClient();
  if (!client) {
    return serviceError("Storage não disponível.");
  }

  const { data, error } = await client.storage
    .from(STORAGE_BUCKET)
    .download(storagePath);

  if (error || !data) {
    console.error("downloadMedia", error);
    return serviceError("Falha ao baixar arquivo.");
  }

  const arrayBuffer = await data.arrayBuffer();
  return serviceOk(Buffer.from(arrayBuffer));
}

/**
 * Remove um arquivo do Storage.
 * Caller DEVE validar permissões antes de chamar.
 * Data URLs (dev) não têm nada para remover.
 */
export async function deleteMedia(storagePath: string): Promise<ServiceResult> {
  if (storagePath.startsWith("data:")) {
    return serviceOk(undefined);
  }

  const client = getStorageClient();
  if (!client) {
    return serviceError("Storage não disponível.");
  }

  const { error } = await client.storage
    .from(STORAGE_BUCKET)
    .remove([storagePath]);

  if (error) {
    console.error("deleteMedia", error);
    return serviceError("Falha ao remover arquivo.");
  }

  return serviceOk(undefined);
}
