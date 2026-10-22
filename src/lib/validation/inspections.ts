import { z } from "zod";

import { idSchema, optionalDate, optionalText } from "./common";

const optionalId = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const inspectionCreateSchema = z.object({
  assetId: idSchema,
  templateId: idSchema,
  technicianId: optionalId,
  scheduledFor: optionalDate,
  notes: optionalText(1000),
});

export type InspectionCreateInput = z.infer<typeof inspectionCreateSchema>;

export const inspectionResults = ["OK", "NOT_OK", "NA"] as const;

export const inspectionResponseInputSchema = z.object({
  id: idSchema,
  result: z.enum(inspectionResults).optional(),
  textValue: optionalText(600),
  numberValue: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? Number(value.replace(",", ".")) : undefined))
    .refine(
      (value) => value === undefined || (Number.isFinite(value) && Math.abs(value) <= 999999),
      "Informe um número válido",
    ),
  notes: optionalText(600),
});

export type InspectionResponseInput = z.infer<typeof inspectionResponseInputSchema>;

export const inspectionFormItemSchema = inspectionResponseInputSchema.extend({
  photo: z.string().trim().optional(),
});

export type InspectionFormItem = z.infer<typeof inspectionFormItemSchema>;
