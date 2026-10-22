import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const DATA_DIR = "./.pglite";
const PORT = 5433;

async function main() {
  const db = new PGlite(DATA_DIR);
  await db.waitReady;

  const server = new PGLiteSocketServer({
    db,
    port: PORT,
    host: "127.0.0.1",
    maxConnections: 10,
  });

  await server.start();

  console.log(
    `PGlite pronto: postgresql://postgres:postgres@127.0.0.1:${PORT}/postgres?schema=public`,
  );

  const shutdown = async () => {
    await server.stop();
    await db.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error("Falha ao iniciar o PGlite:", error);
  process.exit(1);
});
