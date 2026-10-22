import "server-only";

import type { ChecklistItemInput, ChecklistTemplateInput } from "@/lib/validation/checklists";
import { createTenantClient } from "@/server/db/tenant";
import { serviceError, serviceOk, type ServiceResult } from "./result";

export async function listChecklists(companyId: string) {
  const db = createTenantClient(companyId);
  return db.checklistTemplate.findMany({
    where: { companyId },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: {
      _count: { select: { items: true, inspections: true } },
    },
  });
}

export async function listActiveChecklists(companyId: string) {
  const db = createTenantClient(companyId);
  return db.checklistTemplate.findMany({
    where: { companyId, isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, category: true },
  });
}

export async function getChecklistTemplate(companyId: string, id: string) {
  const db = createTenantClient(companyId);
  return db.checklistTemplate.findFirst({
    where: { companyId, id },
    include: {
      items: { orderBy: { position: "asc" } },
      _count: { select: { inspections: true } },
    },
  });
}

export async function createChecklistTemplate(
  companyId: string,
  data: ChecklistTemplateInput,
) {
  const db = createTenantClient(companyId);
  return db.checklistTemplate.create({
    data: {
      companyId,
      name: data.name,
      description: data.description,
      category: data.category,
    },
  });
}

export async function updateChecklistTemplate(
  companyId: string,
  id: string,
  data: ChecklistTemplateInput,
) {
  const db = createTenantClient(companyId);
  const result = await db.checklistTemplate.updateMany({
    where: { companyId, id },
    data: {
      name: data.name,
      description: data.description,
      category: data.category,
    },
  });
  return result.count > 0;
}

export async function setChecklistActive(
  companyId: string,
  id: string,
  isActive: boolean,
) {
  const db = createTenantClient(companyId);
  const result = await db.checklistTemplate.updateMany({
    where: { companyId, id },
    data: { isActive },
  });
  return result.count > 0;
}

export async function addChecklistItem(
  companyId: string,
  templateId: string,
  data: ChecklistItemInput,
): Promise<ServiceResult> {
  const db = createTenantClient(companyId);
  const template = await db.checklistTemplate.findFirst({
    where: { companyId, id: templateId },
    select: { id: true },
  });
  if (!template) return serviceError("Checklist não encontrado.");

  const last = await db.checklistTemplateItem.aggregate({
    where: { companyId, templateId },
    _max: { position: true },
  });

  await db.checklistTemplateItem.create({
    data: {
      companyId,
      templateId,
      label: data.label,
      helpText: data.helpText,
      type: data.type,
      required: data.required,
      requiresPhotoOnFail: data.requiresPhotoOnFail,
      minValue: data.minValue,
      maxValue: data.maxValue,
      unit: data.unit,
      position: (last._max.position ?? 0) + 1,
    },
  });

  return serviceOk(undefined);
}

export async function deleteChecklistItem(
  companyId: string,
  templateId: string,
  itemId: string,
): Promise<ServiceResult> {
  const db = createTenantClient(companyId);
  const item = await db.checklistTemplateItem.findFirst({
    where: { companyId, templateId, id: itemId },
    select: { id: true },
  });
  if (!item) return serviceError("Item não encontrado.");

  const used = await db.inspectionResponse.count({
    where: { companyId, templateItemId: itemId },
  });
  if (used > 0) {
    return serviceError(
      "Este item já foi usado em inspeções e não pode ser removido. Edite o checklist ou crie um novo.",
    );
  }

  const deleted = await db.checklistTemplateItem.deleteMany({
    where: { companyId, templateId, id: itemId },
  });
  return deleted.count > 0 ? serviceOk(undefined) : serviceError("Item não encontrado.");
}
