import { z } from "zod";

export const idSchema = z.string().trim().min(1, "Registro inválido");

export function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max, `Máximo de ${max} caracteres`)
    .optional()
    .transform((value) => (value ? value : undefined));
}

export const optionalEmail = z
  .string()
  .trim()
  .max(254)
  .optional()
  .transform((value) => (value ? value : undefined))
  .pipe(z.string().email("E-mail inválido").optional());

export const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))
  .pipe(
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida")
      .optional(),
  );

export const requiredDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida");

export function toFieldErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }
  return fieldErrors;
}
