"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  completeWorkOrderSchema,
  executionSchema,
  workOrderItemSchema,
  workOrderSchema,
  workOrderStatuses,
} from "@/lib/validation/work-orders";
import { idSchema } from "@/lib/validation/common";
import { requireAdmin, requireUser } from "@/server/auth/session";
import {
  addWorkOrderItem,
  completeWorkOrder,
  deleteWorkOrderItem,
  saveExecution,
  transitionWorkOrder,
} from "@/server/services/work-order-execution";
import { createWorkOrder, updateWorkOrder } from "@/server/services/work-orders";
import { formText, invalidState, type ActionState } from "./state";

function revalidateWorkOrder(id: string) {
  revalidatePath("/app/ordens");
  revalidatePath(`/app/ordens/${id}`);
  revalidatePath("/campo");
  revalidatePath(`/campo/os/${id}`);
}

function parseWorkOrderForm(formData: FormData) {
  return workOrderSchema.safeParse({
    siteId: formText(formData, "siteId"),
    assetId: formText(formData, "assetId"),
    type: formText(formData, "type"),
    priority: formText(formData, "priority"),
    title: formText(formData, "title"),
    description: formText(formData, "description"),
    assignedToId: formText(formData, "assignedToId"),
    dueAt: formText(formData, "dueAt"),
    scheduledAt: formText(formData, "scheduledAt"),
  });
}

export async function createWorkOrderAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireAdmin();
  const parsed = parseWorkOrderForm(formData);
  if (!parsed.success) return invalidState(parsed.error);

  const result = await createWorkOrder(user.companyId, user.id, parsed.data);
  if (!result.ok) return { error: result.error };

  revalidatePath("/app/ordens");
  redirect(`/app/ordens/${result.data.id}`);
}

export async function updateWorkOrderAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireAdmin();

  const id = idSchema.safeParse(formText(formData, "id"));
  if (!id.success) return { error: "OS inválida." };

  const parsed = parseWorkOrderForm(formData);
  if (!parsed.success) return invalidState(parsed.error);

  const result = await updateWorkOrder(user.companyId, id.data, parsed.data);
  if (!result.ok) return { error: result.error };

  revalidateWorkOrder(id.data);
  revalidatePath(`/app/ordens/${id.data}/editar`);
  return { success: "OS atualizada." };
}

export async function transitionWorkOrderAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const id = idSchema.safeParse(formText(formData, "id"));
  if (!id.success) return { error: "OS inválida." };

  const to = formText(formData, "to");
  if (!workOrderStatuses.includes(to as (typeof workOrderStatuses)[number])) {
    return { error: "Status inválido." };
  }

  const result = await transitionWorkOrder(
    user.companyId,
    id.data,
    to as (typeof workOrderStatuses)[number],
    { userId: user.id, role: user.role },
    {
      note: formText(formData, "note") || undefined,
      cancelReason: formText(formData, "cancelReason") || undefined,
    },
  );
  if (!result.ok) return { error: result.error };

  revalidateWorkOrder(id.data);
  return { success: "Status atualizado." };
}

export async function saveExecutionAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const id = idSchema.safeParse(formText(formData, "workOrderId"));
  if (!id.success) return { error: "OS inválida." };

  const parsed = executionSchema.safeParse({
    diagnosis: formText(formData, "diagnosis"),
    solution: formText(formData, "solution"),
    observations: formText(formData, "observations"),
    laborMinutes: formText(formData, "laborMinutes"),
  });
  if (!parsed.success) return invalidState(parsed.error);

  const result = await saveExecution(user.companyId, id.data, { userId: user.id, role: user.role }, parsed.data);
  if (!result.ok) return { error: result.error };

  revalidateWorkOrder(id.data);
  return { success: "Execução salva." };
}

export async function addWorkOrderItemAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const id = idSchema.safeParse(formText(formData, "workOrderId"));
  if (!id.success) return { error: "OS inválida." };

  const parsed = workOrderItemSchema.safeParse({
    kind: formText(formData, "kind"),
    description: formText(formData, "description"),
    quantity: formText(formData, "quantity"),
    unit: formText(formData, "unit"),
    notes: formText(formData, "notes"),
  });
  if (!parsed.success) return invalidState(parsed.error);

  const result = await addWorkOrderItem(
    user.companyId,
    id.data,
    { userId: user.id, role: user.role },
    parsed.data,
  );
  if (!result.ok) return { error: result.error };

  revalidateWorkOrder(id.data);
  return { success: "Item adicionado." };
}

export async function deleteWorkOrderItemAction(formData: FormData): Promise<void> {
  const user = await requireUser();

  const workOrderId = idSchema.safeParse(formText(formData, "workOrderId"));
  const itemId = idSchema.safeParse(formText(formData, "itemId"));
  if (!workOrderId.success || !itemId.success) return;

  await deleteWorkOrderItem(
    user.companyId,
    workOrderId.data,
    itemId.data,
    { userId: user.id, role: user.role },
  );
  revalidateWorkOrder(workOrderId.data);
}

export async function completeWorkOrderAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const id = idSchema.safeParse(formText(formData, "workOrderId"));
  if (!id.success) return { error: "OS inválida." };

  const parsed = completeWorkOrderSchema.safeParse({
    signedByName: formText(formData, "signedByName"),
    signatureDataUrl: formText(formData, "signatureDataUrl"),
    observations: formText(formData, "observations"),
  });
  if (!parsed.success) return invalidState(parsed.error);

  const result = await completeWorkOrder(
    user.companyId,
    id.data,
    { userId: user.id, role: user.role },
    parsed.data,
  );
  if (!result.ok) return { error: result.error };

  revalidateWorkOrder(id.data);
  redirect(user.role === "ADMIN" ? `/app/ordens/${id.data}` : "/campo");
}
