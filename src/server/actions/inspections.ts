"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { inspectionCreateSchema } from "@/lib/validation/inspections";
import { idSchema } from "@/lib/validation/common";
import { requireAdmin, requireUser } from "@/server/auth/session";
import {
  completeInspection,
  createInspection,
  generateWorkOrdersFromInspection,
  saveInspectionResponses,
  startInspection,
} from "@/server/services/inspections";
import { formText, formRaw, invalidState, type ActionState } from "./state";

export async function createInspectionAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireAdmin();

  const parsed = inspectionCreateSchema.safeParse({
    assetId: formText(formData, "assetId"),
    templateId: formText(formData, "templateId"),
    technicianId: formText(formData, "technicianId"),
    scheduledFor: formText(formData, "scheduledFor"),
    notes: formText(formData, "notes"),
  });
  if (!parsed.success) return invalidState(parsed.error);

  const result = await createInspection(user.companyId, parsed.data, user.id);
  if (!result.ok) return { error: result.error };

  revalidatePath("/app/inspecoes");
  redirect(`/app/inspecoes/${result.data.id}`);
}

export async function startInspectionAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const id = idSchema.safeParse(formText(formData, "id"));
  if (!id.success) return { error: "Inspeção inválida." };

  const result = await startInspection(user.companyId, id.data, { userId: user.id, role: user.role });
  if (!result.ok) return { error: result.error };

  revalidatePath("/app/inspecoes");
  revalidatePath("/campo/inspecoes");
  redirect(`/campo/inspecoes/${id.data}`);
}

export async function saveInspectionResponsesAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const id = idSchema.safeParse(formText(formData, "id"));
  if (!id.success) return { error: "Inspeção inválida." };

  const responsesRaw = formRaw(formData, "responses");
  if (!responsesRaw) return { error: "Nenhuma resposta enviada." };

  let responses;
  try {
    responses = JSON.parse(responsesRaw);
  } catch {
    return { error: "Dados de respostas inválidos." };
  }

  const result = await saveInspectionResponses(user.companyId, id.data, responses, { userId: user.id, role: user.role });
  if (!result.ok) return { error: result.error };

  revalidatePath(`/campo/inspecoes/${id.data}`);
  revalidatePath(`/app/inspecoes/${id.data}`);
  return { success: "Respostas salvas." };
}

export async function completeInspectionAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const id = idSchema.safeParse(formText(formData, "id"));
  if (!id.success) return { error: "Inspeção inválida." };

  const result = await completeInspection(user.companyId, id.data, { userId: user.id, role: user.role });
  if (!result.ok) return { error: result.error };

  revalidatePath("/app/inspecoes");
  revalidatePath("/campo/inspecoes");
  revalidatePath(`/app/inspecoes/${id.data}`);
  revalidatePath(`/campo/inspecoes/${id.data}`);
  revalidatePath("/app/ordens");
  revalidatePath("/campo");

  const msg = result.data.generatedWorkOrders > 0
    ? `Inspeção concluída. ${result.data.generatedWorkOrders} OS corretiva(s) gerada(s).`
    : "Inspeção concluída.";
  return { success: msg };
}

export async function generateWorkOrdersAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const id = idSchema.safeParse(formText(formData, "id"));
  if (!id.success) return { error: "Inspeção inválida." };

  const result = await generateWorkOrdersFromInspection(user.companyId, id.data, { userId: user.id, role: user.role });
  if (!result.ok) return { error: result.error };

  revalidatePath("/app/inspecoes");
  revalidatePath("/app/ordens");
  revalidatePath("/campo");

  if (result.data.generated === 0) return { success: "OS já haviam sido geradas para esta inspeção." };
  return { success: `${result.data.generated} OS corretiva(s) gerada(s) com sucesso.` };
}