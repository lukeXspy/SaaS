"use server";

import { Prisma, type AssetStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { assetSchema } from "@/lib/validation/assets";
import { idSchema } from "@/lib/validation/common";
import { requireAdmin } from "@/server/auth/session";
import { createAsset, setAssetStatus, updateAsset } from "@/server/services/assets";
import { formText, invalidState, type ActionState } from "./state";

function parseAssetForm(formData: FormData) {
  return assetSchema.safeParse({
    siteId: formText(formData, "siteId"),
    tag: formText(formData, "tag"),
    name: formText(formData, "name"),
    category: formText(formData, "category"),
    criticality: formText(formData, "criticality"),
    status: formText(formData, "status"),
    manufacturer: formText(formData, "manufacturer"),
    model: formText(formData, "model"),
    serialNumber: formText(formData, "serialNumber"),
    locationNote: formText(formData, "locationNote"),
    installationDate: formText(formData, "installationDate"),
    warrantyUntil: formText(formData, "warrantyUntil"),
    notes: formText(formData, "notes"),
  });
}

function duplicateTagState(): ActionState {
  return {
    error: "Já existe um ativo com esta TAG.",
    fieldErrors: { tag: ["TAG já cadastrada nesta empresa."] },
  };
}

function isDuplicateTag(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function createAssetAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireAdmin();
  const parsed = parseAssetForm(formData);

  if (!parsed.success) return invalidState(parsed.error);

  let assetId: string;
  try {
    const asset = await createAsset(user.companyId, parsed.data);
    if (!asset) return { error: "Local não encontrado." };
    assetId = asset.id;
  } catch (error) {
    if (isDuplicateTag(error)) return duplicateTagState();
    throw error;
  }

  revalidatePath("/app/ativos");
  redirect(`/app/ativos/${assetId}`);
}

export async function updateAssetAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireAdmin();

  const id = idSchema.safeParse(formText(formData, "id"));
  if (!id.success) return { error: "Ativo inválido." };

  const parsed = parseAssetForm(formData);
  if (!parsed.success) return invalidState(parsed.error);

  try {
    const updated = await updateAsset(user.companyId, id.data, parsed.data);
    if (!updated) return { error: "Ativo não encontrado." };
  } catch (error) {
    if (isDuplicateTag(error)) return duplicateTagState();
    throw error;
  }

  revalidatePath("/app/ativos");
  revalidatePath(`/app/ativos/${id.data}`);
  revalidatePath(`/app/ativos/${id.data}/editar`);
  return { success: "Ativo atualizado." };
}

export async function setAssetStatusAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();

  const id = idSchema.safeParse(formText(formData, "id"));
  if (!id.success) return;

  const status = formText(formData, "status");
  if (status !== "ACTIVE" && status !== "INACTIVE" && status !== "DECOMMISSIONED") return;

  const updated = await setAssetStatus(user.companyId, id.data, status as AssetStatus);
  if (!updated) return;

  revalidatePath("/app/ativos");
  revalidatePath(`/app/ativos/${id.data}`);
}
