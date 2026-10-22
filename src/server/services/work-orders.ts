import type {
  WorkOrderPriority,
  WorkOrderStatus,
  WorkOrderType,
  UserRole,
} from "@prisma/client";

import { parseSaoPauloDate } from "@/lib/format";
import type { WorkOrderInput } from "@/lib/validation/work-orders";
import { createTenantClient } from "@/server/db/tenant";
import { serviceError, serviceOk, type ServiceResult } from "./result";

const openStatuses: WorkOrderStatus[] = ["OPEN", "IN_PROGRESS", "WAITING_PARTS"];

export type WorkOrderFilters = {
  query?: string;
  status?: WorkOrderStatus;
  type?: WorkOrderType;
  priority?: WorkOrderPriority;
  assignedToId?: string;
};

type Viewer = { userId: string; role: UserRole };

const listInclude = {
  client: { select: { id: true, name: true } },
  site: { select: { id: true, name: true, city: true, state: true } },
  asset: { select: { id: true, tag: true, name: true } },
  assignedTo: { select: { id: true, name: true } },
} as const;

function viewerFilter(viewer: Viewer) {
  return viewer.role === "TECHNICIAN" ? { assignedToId: viewer.userId } : {};
}

export async function listWorkOrders(
  companyId: string,
  filters: WorkOrderFilters,
  viewer: Viewer,
) {
  const db = createTenantClient(companyId);
  const search = filters.query?.trim();
  const searchNumber = search && /^\d+$/.test(search) ? Number(search) : null;

  return db.workOrder.findMany({
    where: {
      companyId,
      ...viewerFilter(viewer),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.priority ? { priority: filters.priority } : {}),
      ...(filters.assignedToId && viewer.role === "ADMIN"
        ? { assignedToId: filters.assignedToId }
        : {}),
      ...(search
        ? {
            OR: [
              ...(searchNumber !== null ? [{ number: searchNumber }] : []),
              { title: { contains: search, mode: "insensitive" as const } },
              { client: { name: { contains: search, mode: "insensitive" as const } } },
              { asset: { tag: { contains: search, mode: "insensitive" as const } } },
              { asset: { name: { contains: search, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    },
    orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
    include: listInclude,
  });
}

export async function listFieldWorkOrders(companyId: string, userId: string) {
  const db = createTenantClient(companyId);
  return db.workOrder.findMany({
    where: {
      companyId,
      assignedToId: userId,
      status: { in: openStatuses },
    },
    orderBy: [{ dueAt: "asc" }, { priority: "desc" }, { createdAt: "asc" }],
    include: listInclude,
  });
}

export async function getWorkOrder(companyId: string, id: string, viewer: Viewer) {
  const db = createTenantClient(companyId);
  return db.workOrder.findFirst({
    where: { companyId, id, ...viewerFilter(viewer) },
    include: {
      ...listInclude,
      createdBy: { select: { id: true, name: true } },
      execution: true,
      items: { orderBy: { position: "asc" } },
      attachments: {
        where: { kind: "PHOTO" },
        orderBy: { createdAt: "asc" },
        select: { id: true, storagePath: true, fileName: true },
      },
      statusHistory: {
        orderBy: { createdAt: "asc" },
        include: { changedBy: { select: { id: true, name: true } } },
      },
      _count: { select: { attachments: true } },
    },
  });
}

/** Dados para os selects do formulário: clientes → locais → ativos e equipe. */
export async function getWorkOrderOptions(companyId: string) {
  const db = createTenantClient(companyId);

  const [clients, users] = await Promise.all([
    db.client.findMany({
      where: { companyId, isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        sites: {
          where: { isActive: true },
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            assets: {
              where: { status: "ACTIVE" },
              orderBy: { tag: "asc" },
              select: { id: true, tag: true, name: true },
            },
          },
        },
      },
    }),
    db.user.findMany({
      where: { companyId, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true },
    }),
  ]);

  return { clients, users };
}

async function validateRelations(
  companyId: string,
  data: WorkOrderInput,
): Promise<ServiceResult<{ clientId: string }>> {
  const db = createTenantClient(companyId);

  const site = await db.site.findFirst({
    where: { companyId, id: data.siteId },
    select: { id: true, clientId: true },
  });
  if (!site) return serviceError("Local não encontrado.");

  if (data.assetId) {
    const asset = await db.asset.findFirst({
      where: { companyId, id: data.assetId, siteId: site.id },
      select: { id: true },
    });
    if (!asset) return serviceError("O ativo selecionado não pertence a este local.");
  }

  if (data.assignedToId) {
    const assignee = await db.user.findFirst({
      where: { companyId, id: data.assignedToId, isActive: true },
      select: { id: true },
    });
    if (!assignee) return serviceError("Técnico não encontrado ou inativo.");
  }

  return serviceOk({ clientId: site.clientId });
}

function scheduleDates(data: WorkOrderInput) {
  return {
    dueAt: data.dueAt ? parseSaoPauloDate(data.dueAt, 18) : null,
    scheduledAt: data.scheduledAt ? parseSaoPauloDate(data.scheduledAt, 9) : null,
  };
}

export async function createWorkOrder(
  companyId: string,
  createdById: string,
  data: WorkOrderInput,
): Promise<ServiceResult<{ id: string; number: number }>> {
  const relations = await validateRelations(companyId, data);
  if (!relations.ok) return relations;

  const db = createTenantClient(companyId);

  const company = await db.company.update({
    where: { id: companyId },
    data: { workOrderSequence: { increment: 1 } },
    select: { workOrderSequence: true },
  });

  const workOrder = await db.workOrder.create({
    data: {
      companyId,
      number: company.workOrderSequence,
      title: data.title,
      description: data.description ?? null,
      type: data.type,
      priority: data.priority,
      status: "OPEN",
      clientId: relations.data.clientId,
      siteId: data.siteId,
      assetId: data.assetId ?? null,
      assignedToId: data.assignedToId ?? null,
      createdById,
      ...scheduleDates(data),
      statusHistory: {
        create: {
          companyId,
          toStatus: "OPEN",
          changedById: createdById,
          note: "OS criada.",
        },
      },
    },
    select: { id: true, number: true },
  });

  return serviceOk(workOrder);
}

export async function updateWorkOrder(
  companyId: string,
  id: string,
  data: WorkOrderInput,
): Promise<ServiceResult> {
  const db = createTenantClient(companyId);

  const current = await db.workOrder.findFirst({
    where: { companyId, id },
    select: { status: true },
  });
  if (!current) return serviceError("OS não encontrada.");
  if (current.status === "DONE" || current.status === "CANCELED") {
    return serviceError("Esta OS não pode mais ser editada.");
  }

  const relations = await validateRelations(companyId, data);
  if (!relations.ok) return relations;

  const result = await db.workOrder.updateMany({
    where: { companyId, id },
    data: {
      title: data.title,
      description: data.description ?? null,
      type: data.type,
      priority: data.priority,
      clientId: relations.data.clientId,
      siteId: data.siteId,
      assetId: data.assetId ?? null,
      assignedToId: data.assignedToId ?? null,
      ...scheduleDates(data),
    },
  });

  return result.count > 0 ? serviceOk(undefined) : serviceError("OS não encontrada.");
}
