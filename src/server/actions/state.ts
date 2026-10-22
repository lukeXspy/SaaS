import { z } from "zod";

import { toFieldErrors } from "@/lib/validation/common";

export type ActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[]>;
  /** Dados extras do action (ex.: link de convite, link de reset). */
  data?: Record<string, string>;
};

export const initialActionState: ActionState = {};

export function invalidState(error: z.ZodError): ActionState {
  return {
    error: "Revise os campos destacados.",
    fieldErrors: toFieldErrors(error),
  };
}

export function formText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function formRaw(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" ? value : null;
}
