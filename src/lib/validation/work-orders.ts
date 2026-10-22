import { z } from "zod";

import { idSchema, optionalDate, optionalText } from "./common";

export const workOrderTypes = ["CORRECTIVE", "PREVENTIVE", "INSPECTION"] as const;
export const workOrderPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export const workOrderStatuses = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_PARTS",
  "DONE",
  "CANCELED",
] as const;

const optionalId = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const workOrderSchema = z.object({
  siteId: idSchema,
  assetId: optionalId,
  type: z.enum(workOrderTypes, "Selecione o tipo"),
  priority: z.enum(workOrderPriorities, "Selecione a prioridade"),
  title: z.string().trim().min(3, "Informe o título da OS").max(120, "Título muito longo"),
  description: optionalText(2000),
  assignedToId: optionalId,
  dueAt: optionalDate,
  scheduledAt: optionalDate,
});

export type WorkOrderInput = z.infer<typeof workOrderSchema>;

const optionalMinutes = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? Number(value) : undefined))
  .refine(
    (value) =>
      value === undefined || (Number.isInteger(value) && value >= 0 && value <= 100000),
    "Informe os minutos em número inteiro",
  );

export const executionSchema = z.object({
  diagnosis: optionalText(2000),
  solution: optionalText(2000),
  observations: optionalText(2000),
  laborMinutes: optionalMinutes,
});

export type ExecutionInput = z.infer<typeof executionSchema>;

export const workOrderItemSchema = z.object({
  kind: z.enum(["SERVICE", "PART"], "Selecione o tipo"),
  description: z
    .string()
    .trim()
    .min(2, "Descreva o item")
    .max(200, "Descrição muito longa"),
  quantity: z
    .string()
    .trim()
    .min(1, "Informe a quantidade")
    .transform((value) => Number(value.replace(",", ".")))
    .refine(
      (value) => Number.isFinite(value) && value > 0 && value <= 999999,
      "Quantidade inválida",
    ),
  unit: optionalText(20),
  notes: optionalText(200),
});

export type WorkOrderItemInput = z.infer<typeof workOrderItemSchema>;

export const completeWorkOrderSchema = z.object({
  signedByName: z
    .string()
    .trim()
    .min(2, "Informe o nome de quem assinou")
    .max(120, "Nome muito longo"),
  signatureDataUrl: z
    .string()
    .trim()
    .max(500_000, "Assinatura muito grande")
    .regex(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/, "Assinatura inválida"),
  observations: optionalText(2000),
});

export type CompleteWorkOrderInput = z.infer<typeof completeWorkOrderSchema>;
