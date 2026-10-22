import "server-only";

import type { InspectionCreateInput } from "@/lib/validation/inspections";
import { createTenantClient } from "@/server/db/tenant";
import { serviceError, serviceOk, type ServiceResult } from "./result";
import type { UserRole } from "@prisma/client";

export async function listInspections(
  companyId: string,
  filters: { status?: string; technicianId?: string; assetId?: string } = {},
) {
  const db = createTenantClient(companyId);
  const where: Record<string, unknown> = { companyId };
  if (filters.status) where.status = filters.status;
  if (filters.technicianId) where.technicianId = filters.technicianId;
  if (filters.assetId) where.assetId = filters.assetId;

  return db.inspection.findMany({
    where,
    orderBy: { scheduledFor: "asc" },
    include: {
      asset: { select: { id: true, tag: true, name: true, site: { select: { name: true } } } },
      template: { select: { id: true, name: true } },
      technician: { select: { id: true, name: true } },
      _count: { select: { responses: true, generatedWorkOrders: true, attachments: true } },
    },
  });
}

export async function listActiveAssets(companyId: string) {
  const db = createTenantClient(companyId);
  return db.asset.findMany({
    where: { companyId, status: "ACTIVE" },
    orderBy: { tag: "asc" },
    select: { id: true, tag: true, name: true, site: { select: { name: true } } },
  });
}

export async function listActiveTemplates(companyId: string) {
  const db = createTenantClient(companyId);
  return db.checklistTemplate.findMany({
    where: { companyId, isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, category: true },
  });
}

export async function listTechnicians(companyId: string) {
  const db = createTenantClient(companyId);
  return db.user.findMany({
    where: { companyId, role: "TECHNICIAN", isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function getInspection(companyId: string, id: string) {
  const db = createTenantClient(companyId);
  return db.inspection.findFirst({
    where: { companyId, id },
    include: {
      asset: {
        select: {
          id: true,
          tag: true,
          name: true,
          site: { 
            select: { 
              name: true, 
              city: true, 
              state: true,
              client: { select: { name: true } }
            } 
          },
        },
      },
      template: { select: { id: true, name: true, description: true } },
      technician: { select: { id: true, name: true } },
      responses: {
        orderBy: { templateItem: { position: "asc" } },
        include: {
          templateItem: { select: { id: true, label: true, helpText: true, type: true, required: true, requiresPhotoOnFail: true, minValue: true, maxValue: true, unit: true } },
          attachments: { where: { kind: "PHOTO" }, select: { id: true, storagePath: true, fileName: true } },
        },
      },
      generatedWorkOrders: { select: { id: true, number: true, title: true, status: true } },
      attachments: { where: { kind: "PHOTO" }, select: { id: true, storagePath: true, fileName: true } },
    },
  });
}

export async function createInspection(
  companyId: string,
  data: InspectionCreateInput,
  actorId: string,
): Promise<ServiceResult<{ id: string }>> {
  void actorId; // Reservado para auditoria futura
  const db = createTenantClient(companyId);

  const asset = await db.asset.findFirst({ where: { companyId, id: data.assetId }, select: { id: true } });
  if (!asset) return serviceError("Ativo não encontrado.");

  const template = await db.checklistTemplate.findFirst({ where: { companyId, id: data.templateId, isActive: true }, select: { id: true } });
  if (!template) return serviceError("Checklist não encontrado ou inativo.");

  if (data.technicianId) {
    const tech = await db.user.findFirst({ where: { companyId, id: data.technicianId, role: "TECHNICIAN", isActive: true }, select: { id: true } });
    if (!tech) return serviceError("Técnico não encontrado.");
  }

  const inspection = await db.inspection.create({
    data: {
      companyId,
      assetId: data.assetId,
      templateId: data.templateId,
      technicianId: data.technicianId,
      scheduledFor: data.scheduledFor ? new Date(data.scheduledFor + "T09:00:00-03:00") : null,
      notes: data.notes,
      status: "PENDING",
    },
  });

  return serviceOk({ id: inspection.id });
}

export async function startInspection(
  companyId: string,
  id: string,
  actor: { userId: string; role: UserRole },
): Promise<ServiceResult> {
  const db = createTenantClient(companyId);
  const inspection = await db.inspection.findFirst({ where: { companyId, id }, select: { status: true, technicianId: true } });
  if (!inspection) return serviceError("Inspeção não encontrada.");
  if (inspection.status !== "PENDING") return serviceError("Esta inspeção não pode ser iniciada.");
  if (actor.role === "TECHNICIAN" && inspection.technicianId !== actor.userId) return serviceError("Inspeção não encontrada.");

  await db.inspection.updateMany({
    where: { companyId, id, status: "PENDING" },
    data: { status: "IN_PROGRESS", startedAt: new Date() },
  });

  return serviceOk(undefined);
}

export async function saveInspectionResponses(
  companyId: string,
  inspectionId: string,
  responses: { id: string; result?: string; textValue?: string; numberValue?: number; notes?: string }[],
  actor: { userId: string; role: UserRole },
): Promise<ServiceResult> {
  const db = createTenantClient(companyId);

  const inspection = await db.inspection.findFirst({
    where: { companyId, id: inspectionId },
    select: { status: true, technicianId: true },
  });
  if (!inspection) return serviceError("Inspeção não encontrada.");
  if (inspection.status !== "IN_PROGRESS") return serviceError("Esta inspeção não pode ser editada.");
  if (actor.role === "TECHNICIAN" && inspection.technicianId !== actor.userId) return serviceError("Inspeção não encontrada.");

  await db.$transaction(
    responses.map((r) =>
      db.inspectionResponse.updateMany({
        where: { companyId, id: r.id },
        data: {
          result: r.result as "OK" | "NOT_OK" | "NA" | null,
          textValue: r.textValue,
          numberValue: r.numberValue,
          notes: r.notes,
          respondedAt: r.result ? new Date() : null,
        },
      }),
    ),
  );

  return serviceOk(undefined);
}

export async function completeInspection(
  companyId: string,
  id: string,
  actor: { userId: string; role: UserRole },
): Promise<ServiceResult<{ generatedWorkOrders: number }>> {
  const db = createTenantClient(companyId);

  const inspection = await db.inspection.findFirst({
    where: { companyId, id },
    include: {
      responses: {
        include: { templateItem: { select: { id: true, label: true, type: true, required: true, requiresPhotoOnFail: true, minValue: true, maxValue: true } } },
      },
      asset: { select: { id: true, tag: true, name: true, siteId: true, site: { select: { clientId: true } } } },
      template: { select: { id: true, name: true } },
    },
  });

  if (!inspection) return serviceError("Inspeção não encontrada.");
  if (inspection.status !== "IN_PROGRESS") return serviceError("Esta inspeção não pode ser concluída.");
  if (actor.role === "TECHNICIAN" && inspection.technicianId !== actor.userId) return serviceError("Inspeção não encontrada.");

  // Validar respostas obrigatórias
  const missingRequired = inspection.responses.filter(
    (r) => r.templateItem.required && (r.result === null || r.result === undefined),
  );
  if (missingRequired.length > 0) {
    return serviceError(`Responda aos ${missingRequired.length} item(ns) obrigatório(s) antes de concluir.`);
  }

  // Validar foto na falha - check attachments for NOT_OK items that require photo
  const notOkResponses = inspection.responses.filter((r) => r.result === "NOT_OK");
  for (const r of notOkResponses) {
    if (r.templateItem.requiresPhotoOnFail) {
      const hasPhoto = await db.attachment.count({
        where: { companyId, inspectionResponseId: r.id, kind: "PHOTO" },
      });
      if (hasPhoto === 0) {
        return serviceError(`Anexe foto(s) para o item reprovado "${r.templateItem.label}" que exige evidência.`);
      }
    }
  }

  const okCount = inspection.responses.filter((r) => r.result === "OK").length;
  const notOkCount = inspection.responses.filter((r) => r.result === "NOT_OK").length;
  const scorePercent = okCount + notOkCount > 0 ? Math.round((okCount / (okCount + notOkCount)) * 100) : null;

  // Gerar OS corretivas para itens NOT_OK
  const notOkItems = inspection.responses.filter((r) => r.result === "NOT_OK");
  let generatedWorkOrders = 0;

  if (notOkItems.length > 0) {
    const company = await db.company.findUnique({ where: { id: companyId }, select: { workOrderSequence: true } });
    if (!company) return serviceError("Empresa não encontrada.");

    const newSequence = company.workOrderSequence + notOkItems.length;
    await db.company.update({ where: { id: companyId }, data: { workOrderSequence: newSequence } });

    const now = new Date();
    const dueAt = new Date(now);
    dueAt.setDate(dueAt.getDate() + 3);
    dueAt.setHours(18, 0, 0, 0);

    const site = await db.site.findFirst({ where: { id: inspection.asset.siteId }, select: { clientId: true } });
    const clientId = site?.clientId ?? inspection.asset.site.clientId;

    const workOrderData = notOkItems.map((r, idx) => ({
      companyId,
      number: company.workOrderSequence + 1 + idx,
      title: `Corretiva — ${r.templateItem.label}`,
      description: `Gerada automaticamente pela inspeção ${inspection.template.name} (${inspection.asset.tag}).\nItem reprovado: ${r.templateItem.label}`,
      type: "CORRECTIVE" as const,
      priority: "HIGH" as const,
      status: "OPEN" as const,
      clientId: clientId!,
      siteId: inspection.asset.siteId,
      assetId: inspection.asset.id,
      assignedToId: inspection.technicianId ?? actor.userId,
      createdById: actor.userId,
      dueAt,
      originInspectionId: inspection.id,
    }));

    await db.workOrder.createMany({ data: workOrderData });

    // Histórico de status
    const createdWOs = await db.workOrder.findMany({
      where: { companyId, originInspectionId: inspection.id },
      select: { id: true },
    });

    if (createdWOs.length > 0) {
      await db.workOrderStatusHistory.createMany({
        data: createdWOs.map((wo) => ({
          companyId,
          workOrderId: wo.id,
          fromStatus: "OPEN",
          toStatus: "OPEN",
          note: "OS corretiva gerada automaticamente por inspeção.",
          createdById: actor.userId,
        })),
      });
    }

    generatedWorkOrders = notOkItems.length;
  }

  await db.inspection.updateMany({
    where: { companyId, id, status: "IN_PROGRESS" },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      scorePercent,
      failedItemCount: notOkCount,
    },
  });

  return serviceOk({ generatedWorkOrders });
}

export async function generateWorkOrdersFromInspection(
  companyId: string,
  id: string,
  actor: { userId: string; role: UserRole },
): Promise<ServiceResult<{ generated: number }>> {
  const db = createTenantClient(companyId);

  const inspection = await db.inspection.findFirst({
    where: { companyId, id },
    include: {
      responses: {
        where: { result: "NOT_OK" },
        include: { templateItem: { select: { id: true, label: true } } },
      },
      asset: { select: { id: true, tag: true, name: true, siteId: true, site: { select: { clientId: true } } } },
      template: { select: { id: true, name: true } },
    },
  });

  if (!inspection) return serviceError("Inspeção não encontrada.");
  if (inspection.status !== "COMPLETED") return serviceError("Apenas inspeções concluídas podem gerar OS.");
  if (actor.role === "TECHNICIAN" && inspection.technicianId !== actor.userId) return serviceError("Inspeção não encontrada.");

  const existing = await db.workOrder.count({ where: { companyId, originInspectionId: inspection.id } });
  if (existing > 0) return serviceOk({ generated: 0 });

  const notOkItems = inspection.responses;
  if (notOkItems.length === 0) return serviceOk({ generated: 0 });

  const company = await db.company.findUnique({ where: { id: companyId }, select: { workOrderSequence: true } });
  if (!company) return serviceError("Empresa não encontrada.");

  const newSequence = company.workOrderSequence + notOkItems.length;
  await db.company.update({ where: { id: companyId }, data: { workOrderSequence: newSequence } });

  const now = new Date();
  const dueAt = new Date(now);
  dueAt.setDate(dueAt.getDate() + 3);
  dueAt.setHours(18, 0, 0, 0);

  const site = await db.site.findFirst({ where: { id: inspection.asset.siteId }, select: { clientId: true } });
  const clientId = site?.clientId ?? inspection.asset.site.clientId;

  const workOrderData = notOkItems.map((r, idx) => ({
    companyId,
    number: company.workOrderSequence + 1 + idx,
    title: `Corretiva — ${r.templateItem.label}`,
    description: `Gerada automaticamente pela inspeção ${inspection.template.name} (${inspection.asset.tag}).\nItem reprovado: ${r.templateItem.label}`,
    type: "CORRECTIVE" as const,
    priority: "HIGH" as const,
    status: "OPEN" as const,
    clientId: clientId!,
    siteId: inspection.asset.siteId,
    assetId: inspection.asset.id,
    assignedToId: inspection.technicianId ?? actor.userId,
    createdById: actor.userId,
    dueAt,
    originInspectionId: inspection.id,
  }));

  await db.workOrder.createMany({ data: workOrderData });

  const createdWOs = await db.workOrder.findMany({
    where: { companyId, originInspectionId: inspection.id },
    select: { id: true },
  });

  if (createdWOs.length > 0) {
    await db.workOrderStatusHistory.createMany({
      data: createdWOs.map((wo) => ({
        companyId,
        workOrderId: wo.id,
        fromStatus: "OPEN",
        toStatus: "OPEN",
        note: "OS corretiva gerada automaticamente por inspeção.",
        createdById: actor.userId,
      })),
    });
  }

  return serviceOk({ generated: notOkItems.length });
}