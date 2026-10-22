"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { idSchema } from "@/lib/validation/common";
import {
  acceptInviteSchema,
  changePasswordSchema,
  inviteSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "@/lib/validation/users";
import { requireAdmin, requireUser } from "@/server/auth/session";
import {
  acceptInvite,
  changePassword,
  createInvite,
  generateResetLink,
  resetPassword,
  revokeInvite,
  setUserActive,
  updateProfile,
} from "@/server/services/users";
import { formText, invalidState, type ActionState } from "./state";

// ─────────────────────────────────────────────────────────────
// Convites (admin)
// ─────────────────────────────────────────────────────────────

export async function inviteUserAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();

  const parsed = inviteSchema.safeParse({
    email: formText(formData, "email"),
    role: formText(formData, "role"),
  });
  if (!parsed.success) return invalidState(parsed.error);

  const result = await createInvite(admin.companyId, admin.id, parsed.data);
  if (!result.ok) return { error: result.error };

  revalidatePath("/app/tecnicos");
  return {
    success: `Convite criado! Copie o link abaixo e envie para ${result.data.email} via WhatsApp.`,
    data: { inviteLink: result.data.inviteLink },
  };
}

export async function revokeInviteAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = idSchema.safeParse(formText(formData, "id"));
  if (!id.success) return;

  await revokeInvite(admin.companyId, id.data);
  revalidatePath("/app/tecnicos");
}

// ─────────────────────────────────────────────────────────────
// Aceite de convite (público com token)
// ─────────────────────────────────────────────────────────────

export async function acceptInviteAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = formText(formData, "token");
  if (!token) return { error: "Token inválido." };

  const parsed = acceptInviteSchema.safeParse({
    name: formText(formData, "name"),
    password: formText(formData, "password"),
  });
  if (!parsed.success) return invalidState(parsed.error);

  const result = await acceptInvite(token, parsed.data);
  if (!result.ok) return { error: result.error };

  // Após aceitar, o usuário faz login com a senha que acabou de definir.
  // Não fazemos login automático — forçamos um login fresco por segurança.
  redirect(`/login?email=${encodeURIComponent(formText(formData, "email"))}&msg=convite-aceito`);
}

// ─────────────────────────────────────────────────────────────
// Reset de senha (admin gera link → usuário redefine)
// ─────────────────────────────────────────────────────────────

export async function generateResetLinkAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  const userId = idSchema.safeParse(formText(formData, "userId"));
  if (!userId.success) return { error: "Usuário inválido." };

  const result = await generateResetLink(admin.companyId, userId.data);
  if (!result.ok) return { error: result.error };

  revalidatePath(`/app/tecnicos/${userId.data}`);
  revalidatePath("/app/tecnicos");

  return {
    success: `Link de redefinição gerado para ${result.data.userName}. Copie e envie via WhatsApp.`,
    data: { resetLink: result.data.resetLink },
  };
}

export async function resetPasswordAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = formText(formData, "token");
  if (!token) return { error: "Token inválido." };

  const parsed = resetPasswordSchema.safeParse({
    password: formText(formData, "password"),
  });
  if (!parsed.success) return invalidState(parsed.error);

  const result = await resetPassword(token, parsed.data);
  if (!result.ok) return { error: result.error };

  return { success: "Senha redefinida! Faça login com a nova senha." };
}

// ─────────────────────────────────────────────────────────────
// Conta própria (usuário logado)
// ─────────────────────────────────────────────────────────────

export async function changePasswordAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formText(formData, "currentPassword"),
    newPassword: formText(formData, "newPassword"),
  });
  if (!parsed.success) return invalidState(parsed.error);

  const result = await changePassword(user.id, parsed.data);
  if (!result.ok) return { error: result.error };

  return { success: "Senha alterada com sucesso." };
}

export async function updateProfileAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = updateProfileSchema.safeParse({
    name: formText(formData, "name"),
    email: formText(formData, "email"),
    phone: formText(formData, "phone"),
  });
  if (!parsed.success) return invalidState(parsed.error);

  const result = await updateProfile(user.id, parsed.data);
  if (!result.ok) return { error: result.error };

  revalidatePath("/app/configuracoes/conta");
  revalidatePath("/campo");
  return { success: "Perfil atualizado." };
}

// ─────────────────────────────────────────────────────────────
// Admin: ativar/desativar
// ─────────────────────────────────────────────────────────────

export async function toggleUserActiveAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const userId = idSchema.safeParse(formText(formData, "userId"));
  if (!userId.success) return;

  const isActive = formText(formData, "isActive") === "true";
  if (userId.data === admin.id && isActive) {
    return; // Não faz sentido "reativar a si mesmo"
  }

  await setUserActive(admin.companyId, userId.data, !isActive);
  revalidatePath("/app/tecnicos");
  revalidatePath(`/app/tecnicos/${userId.data}`);
}