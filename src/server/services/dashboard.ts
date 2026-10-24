import "server-only";

import { createTenantClient } from "@/server/db/tenant";

export type AdminSummary = {
  activeClients: number;
  activeSites: number;
  activeAssets: number;
  openWorkOrders: number;
  overdueWorkOrders: number;
  statusBreakdown: {
    open: number;
    inProgress: number;
    waitingParts: number;
    done: number;
    canceled: number;
  };
  completedThisMonth: number;
  activeTechnicians: number;
  recentWorkOrders: Array<{
    id: string;
    number: number;
    title: string;
    status: "OPEN" | "IN_PROGRESS" | "WAITING_PARTS" | "DONE" | "CANCELED";
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    dueAt: Date | null;
    assignedTo: { name: string } | null;
    client: { name: string };
  }>;
};

export async function getAdminSummary(companyId: string): Promise<AdminSummary> {
  const db = createTenantClient(companyId);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const openStatuses = ["OPEN", "IN_PROGRESS", "WAITING_PARTS"] as const;

  const [
    activeClients,
    activeSites,
    activeAssets,
    openWorkOrders,
    overdueWorkOrders,
    statusCounts,
    completedThisMonth,
    activeTechnicians,
    recentWorkOrders,
  ] = await Promise.all([
    db.client.count({ where: { companyId, isActive: true } }),
    db.site.count({ where: { companyId, isActive: true } }),
    db.asset.count({ where: { companyId, status: "ACTIVE" } }),
    db.workOrder.count({ where: { companyId, status: { in: [...openStatuses] } } }),
    db.workOrder.count({
      where: {
        companyId,
        status: { in: [...openStatuses] },
        dueAt: { lt: now },
      },
    }),
    db.workOrder.groupBy({
      by: ["status"],
      where: { companyId },
      _count: { _all: true },
    }),
    db.workOrder.count({
      where: {
        companyId,
        status: "DONE",
        completedAt: { gte: startOfMonth },
      },
    }),
    db.user.count({
      where: { companyId, role: "TECHNICIAN", isActive: true },
    }),
    db.workOrder.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        number: true,
        title: true,
        status: true,
        priority: true,
        dueAt: true,
        assignedTo: { select: { name: true } },
        client: { select: { name: true } },
      },
    }),
  ]);

  const statusMap = new Map(statusCounts.map((s) => [s.status, s._count._all]));

  return {
    activeClients,
    activeSites,
    activeAssets,
    openWorkOrders,
    overdueWorkOrders,
    statusBreakdown: {
      open: statusMap.get("OPEN") ?? 0,
      inProgress: statusMap.get("IN_PROGRESS") ?? 0,
      waitingParts: statusMap.get("WAITING_PARTS") ?? 0,
      done: statusMap.get("DONE") ?? 0,
      canceled: statusMap.get("CANCELED") ?? 0,
    },
    completedThisMonth,
    activeTechnicians,
    recentWorkOrders: recentWorkOrders.map((wo) => ({
      ...wo,
      status: wo.status as AdminSummary["recentWorkOrders"][number]["status"],
      priority: wo.priority as AdminSummary["recentWorkOrders"][number]["priority"],
    })),
  };
}