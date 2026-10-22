import { z } from "zod";

import { optionalText } from "./common";

export const checklistItemTypes = ["TRI_STATE", "TEXT", "NUMBER", "PHOTO"] as const;
export const assetCategories = [
  "ELECTRICAL",
  "REFRIGERATION",
  "HVAC",
  "AUTOMATION",
  "MECHANICAL",
  "CIVIL",
  "OTHER",
] as const;

const optionalCategory = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))
  .pipe(z.enum(assetCategories, "Categoria inválida").optional());

export const checklistTemplateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Informe o nome do checklist")
    .max(120, "Nome muito longo"),
  description: optionalText(500),
  category: optionalCategory,
});

export type ChecklistTemplateInput = z.infer<typeof checklistTemplateSchema>;

const optionalNumber = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? Number(value.replace(",", ".")) : undefined))
  .refine(
    (value) => value === undefined || (Number.isFinite(value) && Math.abs(value) <= 999999),
    "Informe um número válido",
  );

export const checklistItemSchema = z
  .object({
    label: z
      .string()
      .trim()
      .min(2, "Descreva o item")
      .max(160, "Descrição muito longa"),
    helpText: optionalText(300),
    type: z.enum(checklistItemTypes, "Selecione o tipo do item"),
    required: z.boolean(),
    requiresPhotoOnFail: z.boolean(),
    minValue: optionalNumber,
    maxValue: optionalNumber,
    unit: optionalText(20),
  })
  .refine(
    (value) =>
      value.minValue === undefined ||
      value.maxValue === undefined ||
      value.minValue <= value.maxValue,
    { message: "O mínimo não pode ser maior que o máximo", path: ["maxValue"] },
  );

export type ChecklistItemInput = z.infer<typeof checklistItemSchema>;
