import { prisma } from "@/server/db/client";

export const dynamic = "force-dynamic";

/**
 * Health check para uptime monitor (UptimeRobot etc.).
 * Não expõe detalhes de erro nem dados internos.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({
      status: "ok",
      database: "up",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return Response.json(
      {
        status: "degraded",
        database: "down",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
