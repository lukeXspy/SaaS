/**
 * Testa a conexão com o Supabase e mostra a URL correta quando funcionar.
 * Uso: node scripts/test-supabase.cjs
 *
 * Aguarde 5-10 minutos após criar o projeto antes de rodar.
 */

const { PrismaClient } = require("@prisma/client");

const PROJECT = "yyjddvaxuupnfjtlowop";
const PASSWORD = "MarconSaaS2026%2A%2A%40%40";

// Regiões onde a pooler do Supabase responde
const poolers = [
  { host: "aws-0-sa-east-1.pooler.supabase.com", port: 6543, label: "sa-east-1 (São Paulo)" },
  { host: "aws-0-us-east-1.pooler.supabase.com", port: 6543, label: "us-east-1 (Virginia)" },
  { host: "aws-0-us-west-1.pooler.supabase.com", port: 6543, label: "us-west-1 (Oregon)" },
];

async function testPooler(host, port) {
  const url = `postgresql://postgres.${PROJECT}:${PASSWORD}@${host}:${port}/postgres?pgbouncer=true&schema=public`;
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    const r = await prisma.$queryRaw`SELECT current_database() as db`;
    await prisma.$disconnect();
    return { ok: true, url };
  } catch (err) {
    await prisma.$disconnect().catch(() => {});
    return { ok: false, error: err.message.split("\n")[1] ?? err.message.slice(0, 100) };
  }
}

(async () => {
  console.log("🔍 Testando conexão com o Supabase...\n");

  for (const p of poolers) {
    process.stdout.write(`  ${p.label}... `);
    const result = await testPooler(p.host, p.port);
    if (result.ok) {
      console.log("✅ CONECTADO!\n");
      console.log("═══════════════════════════════════════════════════");
      console.log("✅ SUPABASE PRONTO! Use estas URLs no .env:");
      console.log("═══════════════════════════════════════════════════\n");
      console.log(`DATABASE_URL="${result.url}"`);
      console.log(`DIRECT_URL="postgresql://postgres.${PROJECT}:${PASSWORD}@${p.host}:5432/postgres"`);
      process.exit(0);
    }
    console.log(`❌ ${result.error}`);
  }

  console.log("\n⏳ Projeto ainda não registrado na pooler.");
  console.log("   Isto é normal para projetos recém-criados.");
  console.log("   Aguarde 5-10 minutos e rode este script novamente.");
  console.log("   Se persistir após 15 min, verifique:");
  console.log("   1. Dashboard → Database → Connect (botão verde)");
  console.log("   2. Settings → Database → Connection pooling");
  console.log("   3. Settings → Database → Reset database password");
  process.exit(1);
})();
