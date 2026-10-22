import { z } from "zod";

import { optionalText } from "./common";

export const userRoles = ["ADMIN", "TECHNICIAN"] as const;

/** Convite: admin informa e-mail e papel do novo usuário. */
export const inviteSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe o e-mail")
    .max(254)
    .pipe(z.string().email("E-mail inválido")),
  role: z.enum(userRoles, "Selecione o papel"),
});

export type InviteInput = z.infer<typeof inviteSchema>;

/** Aceite de convite: técnico define nome e senha. */
export const acceptInviteSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe seu nome completo")
    .max(120, "Nome muito longo"),
  password: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres")
    .max(72, "Senha muito longa"),
});

export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;

/** Reset de senha com token. */
export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres")
    .max(72, "Senha muito longa"),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/** Trocar a própria senha (usuário logado). */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Informe a senha atual"),
  newPassword: z
    .string()
    .min(8, "A nova senha deve ter pelo menos 8 caracteres")
    .max(72, "Senha muito longa"),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/** Atualizar o próprio perfil. */
export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe seu nome")
    .max(120, "Nome muito longo"),
  email: z
    .string()
    .trim()
    .min(1, "Informe o e-mail")
    .max(254)
    .pipe(z.string().email("E-mail inválido")),
  phone: optionalText(20),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;