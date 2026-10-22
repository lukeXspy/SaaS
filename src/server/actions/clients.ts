"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { clientSchema, siteSchema } from "@/lib/validation/clients";
import { idSchema } from "@/lib/validation/common";
import { requireAdmin } from "@/server/auth/session";
import {
  createClient,
  createSite,
  setClientActive,
  setSiteActive,
  updateClient,
  updateSite,
} from "@/server/services/clients";
import { formText, invalidState, type ActionState } from "./state";

export async function createClientAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireAdmin();

  const parsed = clientSchema.safeParse({
    name: formText(formData, "name"),
    tradeName: formText(formData, "tradeName"),
    document: formText(formData, "document"),
    email: formText(formData, "email"),
    phone: formText(formData, "phone"),
    notes: formText(formData, "notes"),
  });

  if (!parsed.success) return invalidState(parsed.error);

  const client = await createClient(user.companyId, parsed.data);
  revalidatePath("/app/clientes");
  redirect(`/app/clientes/${client.id}`);
}

export async function updateClientAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireAdmin();

  const id = idSchema.safeParse(formText(formData, "id"));
  if (!id.success) return { error: "Cliente inválido." };

  const parsed = clientSchema.safeParse({
    name: formText(formData, "name"),
    tradeName: formText(formData, "tradeName"),
    document: formText(formData, "document"),
    email: formText(formData, "email"),
    phone: formText(formData, "phone"),
    notes: formText(formData, "notes"),
  });
  if (!parsed.success) return invalidState(parsed.error);

  const updated = await updateClient(user.companyId, id.data, parsed.data);
  if (!updated) return { error: "Cliente não encontrado." };

  revalidatePath(`/app/clientes/${id.data}`);
  revalidatePath("/app/clientes");
  return { success: "Dados do cliente atualizados." };
}

export async function toggleClientActiveAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const id = idSchema.safeParse(formText(formData, "id"));
  if (!id.success) return;

  const isActive = formText(formData, "isActive") === "true";
  await setClientActive(user.companyId, id.data, !isActive);
  revalidatePath(`/app/clientes/${id.data}`);
  revalidatePath("/app/clientes");
}

export async function createSiteAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireAdmin();

  const parsed = siteSchema.safeParse({
    clientId: formText(formData, "clientId"),
    name: formText(formData, "name"),
    addressLine: formText(formData, "addressLine"),
    number: formText(formData, "number"),
    complement: formText(formData, "complement"),
    district: formText(formData, "district"),
    city: formText(formData, "city"),
    state: formText(formData, "state"),
    postalCode: formText(formData, "postalCode"),
    contactName: formText(formData, "contactName"),
    contactPhone: formText(formData, "contactPhone"),
    notes: formText(formData, "notes"),
  });

  if (!parsed.success) return invalidState(parsed.error);

  const site = await createSite(user.companyId, parsed.data);
  if (!site) return { error: "Cliente não encontrado." };

  revalidatePath(`/app/clientes/${parsed.data.clientId}`);
  redirect(`/app/locais/${site.id}/editar`);
}

export async function updateSiteAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireAdmin();

  const id = idSchema.safeParse(formText(formData, "id"));
  if (!id.success) return { error: "Local inválido." };

  const parsed = siteSchema.safeParse({
    clientId: formText(formData, "clientId"),
    name: formText(formData, "name"),
    addressLine: formText(formData, "addressLine"),
    number: formText(formData, "number"),
    complement: formText(formData, "complement"),
    district: formText(formData, "district"),
    city: formText(formData, "city"),
    state: formText(formData, "state"),
    postalCode: formText(formData, "postalCode"),
    contactName: formText(formData, "contactName"),
    contactPhone: formText(formData, "contactPhone"),
    notes: formText(formData, "notes"),
  });

  if (!parsed.success) return invalidState(parsed.error);

  const updated = await updateSite(user.companyId, id.data, parsed.data);
  if (!updated) return { error: "Local não encontrado." };

  revalidatePath("/app/locais");
  revalidatePath(`/app/locais/${id.data}/editar`);
  revalidatePath(`/app/clientes/${parsed.data.clientId}`);
  return { success: "Local atualizado." };
}

export async function toggleSiteActiveAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const id = idSchema.safeParse(formText(formData, "id"));
  if (!id.success) return;

  const isActive = formText(formData, "isActive") === "true";
  await setSiteActive(user.companyId, id.data, !isActive);
  revalidatePath("/app/clientes");
  revalidatePath("/app/locais");
}
