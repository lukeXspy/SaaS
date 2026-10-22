import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Informe o e-mail")
  .max(254, "E-mail muito longo")
  .email("Informe um e-mail válido")
  .transform((value) => value.toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres")
  .max(72, "A senha deve ter no máximo 72 caracteres");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Informe a senha"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const acceptInviteSchema = z
  .object({
    name: z.string().trim().min(2, "Informe seu nome").max(120, "Nome muito longo"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não conferem",
  });

export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;

export const requestPasswordResetSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não conferem",
  });
