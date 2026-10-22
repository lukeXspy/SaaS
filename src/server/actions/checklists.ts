"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  addChecklistItem,
  createChecklistTemplate,
  deleteChecklistItem,
  setChecklistActive,
  updateChecklistTemplate,
} from "@/server/services/checklists";
import { checklistItemSchema, checklistTemplateSchema } from "@/lib/validation/checklists";
import { idSchema } from "@/lib/validation/common";
import { requireAdmin } from "@/server/auth/session";
import { formText, invalidState, type ActionState } from "./state";

export async function createChecklistAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireAdmin();
  const parsed = checklistTemplateSchema.safeParse({
    name: formText(formData, "name"),
    description: formText(formData, "description"),
    category: formText(formData, "category"),
  });
  if (!parsed.success) return invalidState(parsed.error);

  const template = await createChecklistTemplate(user.companyId, parsed.data);
  revalidatePath("/app/checklists");
  redirect(`/app/checklists/${template.id}`);
}

export async function updateChecklistAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireAdmin();
  const id = idSchema.safeParse(formText(formData, "id"));
  if (!id.success) return { error: "Checklist inválido." };

  const parsed = checklistTemplateSchema.safeParse({
    name: formText(formData, "name"),
    description: formText(formData, "description"),
    category: formText(formData, "category"),
  });
  if (!parsed.success) return invalidState(parsed.error);

  const updated = await updateChecklistTemplate(user.companyId, id.data, parsed.data);
  if (!updated) return { error: "Checklist não encontrado." };

  revalidatePath("/app/checklists");
  revalidatePath(`/app/checklists/${id.data}`);
  redirect(`/app/checklists/${id.data}`);
}

export async function addChecklistItemAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireAdmin();
  const templateId = idSchema.safeParse(formText(formData, "templateId"));
  if (!templateId.success) return { error: "Checklist inválido." };

  const parsed = checklistItemSchema.safeParse({
    label: formText(formData, "label"),
    helpText: formText(formData, "helpText"),
    type: formText(formData, "type"),
    required: formText(formData, "required") === "on",
    requiresPhotoOnFail: formText(formData, "requiresPhotoOnFail") === "on",
    minValue: formText(formData, "minValue"),
    maxValue: formText(formData, "maxValue"),
    unit: formText(formData, "unit"),
  });
  if (!parsed.success) return invalidState(parsed.error);

  const result = await addChecklistItem(user.companyId, templateId.data, parsed.data);
  if (!result.ok) return { error: result.error };

  revalidatePath(`/app/checklists/${templateId.data}`);
  return { success: "Item adicionado ao checklist." };
}

export async function deleteChecklistItemAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireAdmin();
  const templateId = idSchema.safeParse(formText(formData, "templateId"));
  const itemId = idSchema.safeParse(formText(formData, "itemId"));
  if (!templateId.success || !itemId.success) return { error: "Item inválido." };

  const result = await deleteChecklistItem(user.companyId, templateId.data, itemId.data);
  if (!result.ok) return { error: result.error };

  revalidatePath(`/app/checklists/${templateId.data}`);
  return { success: "Item removido." };
}

export async function toggleChecklistActiveAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const id = idSchema.safeParse(formText(formData, "id"));
  if (!id.success) return;

  await setChecklistActive(user.companyId, id.data, formText(formData, "isActive") !== "true");
  revalidatePath("/app/checklists");
  revalidatePath(`/app/checklists/${id.data}`);
}
