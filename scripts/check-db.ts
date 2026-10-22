import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("DATABASE_URL:", process.env.DATABASE_URL);

  try {
    const result = await prisma.$queryRaw`SELECT 1 as ok`;
    console.log("SELECT 1:", result);
    const users = await prisma.user.count();
    console.log("users:", users);
  } catch (error) {
    console.error("ERRO:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
