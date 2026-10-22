import { z } from "zod";

import { idSchema, optionalEmail, optionalText } from "./common";

export const clientSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do cliente").max(120, "Nome muito longo"),
  tradeName: optionalText(120),
  document: optionalText(20),
  email: optionalEmail,
  phone: optionalText(20),
  notes: optionalText(1000),
});

export type ClientInput = z.infer<typeof clientSchema>;

export const siteSchema = z.object({
  clientId: idSchema,
  name: z.string().trim().min(2, "Informe o nome do local").max(120),
  addressLine: z.string().trim().min(3, "Informe o endereço").max(160),
  number: optionalText(20),
  complement: optionalText(60),
  district: optionalText(60),
  city: z.string().trim().min(2, "Informe a cidade").max(80),
  state: z
    .string()
    .trim()
    .length(2, "Use a sigla do estado (ex.: SP)")
    .transform((value) => value.toUpperCase()),
  postalCode: optionalText(9),
  contactName: optionalText(120),
  contactPhone: optionalText(20),
  notes: optionalText(500),
});

export type SiteInput = z.infer<typeof siteSchema>;
