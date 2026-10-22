import { createTenantClient } from "@/server/db/tenant";

export type AdminSummary = {
  activeClients: number;
  activeSites: number;
  activeAssets: number;
  openWorkOrders: number;
  overdueWorkOrders: number;
};

export async function getAdminSummary(companyId: string): Promise<AdminSummary> {
  const db = createTenantClient(companyId);
  const openStatuses = ["OPEN", "IN_PROGRESS", "WAITING_PARTS"] as const;

  const [activeClients, activeSites, activeAssets, openWorkOrders, overdueWorkOrders] =
    await Promise.all([
      db.client.count({ where: { companyId, isActive: true } }),
      db.site.count({ where: { companyId, isActive: true } }),
      db.asset.count({ where: { companyId, status: "ACTIVE" } }),
      db.workOrder.count({ where: { companyId, status: { in: [...openStatuses] } } }),
      db.workOrder.count({
        where: {
          companyId,
          status: { in: [...openStatuses] },
          dueAt: { lt: new Date() },
        },
      }),
    ]);

  return { activeClients, activeSites, activeAssets, openWorkOrders, overdueWorkOrders };
}
