import { z } from "zod";

import { idSchema, optionalDate, optionalText } from "./common";

export const assetCategories = [
  "ELECTRICAL",
  "REFRIGERATION",
  "HVAC",
  "AUTOMATION",
  "MECHANICAL",
  "CIVIL",
  "OTHER",
] as const;

export const criticalities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export const assetStatuses = ["ACTIVE", "INACTIVE", "DECOMMISSIONED"] as const;

export const assetSchema = z.object({
  siteId: idSchema,
  tag: z
    .string()
    .trim()
    .min(1, "Informe a TAG")
    .max(40, "TAG muito longa")
    .transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2, "Informe o nome do ativo").max(120, "Nome muito longo"),
  category: z.enum(assetCategories, "Selecione a categoria"),
  criticality: z.enum(criticalities, "Selecione a criticidade"),
  status: z.enum(assetStatuses, "Selecione a situação"),
  manufacturer: optionalText(80),
  model: optionalText(80),
  serialNumber: optionalText(80),
  locationNote: optionalText(120),
  installationDate: optionalDate,
  warrantyUntil: optionalDate,
  notes: optionalText(1000),
});

export type AssetInput = z.infer<typeof assetSchema>;
