/**
 * Verifica a conexão com o Supabase (região us-west-2, pooler v2).
 * Uso: npm run supabase:test
 */

const { PrismaClient } = require("@prisma/client");

const PROJECT = "yyjddvaxuupnfjtlowop";
const HOST = "aws-1-us-west-2.pooler.supabase.com";

// Lê a senha do .env (ou usa o padrão)
const DATABASE_URL =
  process.env.DATABASE_URL ??
  `postgresql://postgres.${PROJECT}:${process.env.SUPABASE_DB_PASSWORD ?? ""}@${HOST}:6543/postgres?pgbouncer=true&schema=public`;

async function main() {
  console.log("🔍 Testando conexão com o Supabase...\n");
  console.log(`  Host: ${HOST}`);
  console.log(`  Database URL: ${DATABASE_URL.replace(/:[^:@]+@/, ":***@")}\n`);

  const prisma = new PrismaClient({
    datasources: { db: { url: DATABASE_URL } },
  });

  try {
    const info = await prisma.$queryRaw`
      SELECT
        current_database() as db,
        current_user as usr,
        version() as ver,
        (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as tables
    `;

    console.log("✅ CONECTADO!");
    console.log(`  Database: ${info[0].db}`);
    console.log(`  User: ${info[0].usr}`);
    console.log(`  Version: ${info[0].ver.split(",")[0]}`);
    console.log(`  Tables: ${info[0].tables}`);

    // Verifica dados do seed
    const companies = await prisma.company.count();
    const users = await prisma.user.count();
    console.log(`  Companies: ${companies}`);
    console.log(`  Users: ${users}`);

    console.log("\n✅ Supabase pronto para uso!");
  } catch (err) {
    console.error("❌ Erro:", err.message.split("\n")[0]);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
