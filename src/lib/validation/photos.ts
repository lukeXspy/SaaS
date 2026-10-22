import { z } from "zod";

/**
 * Limite de caracteres da data URL no transporte (cliente → server action).
 * O cliente comprime para ~300 KB, então isto é suficiente.
 * O limite real de 5 MB é validado no Storage (magic bytes + buffer).
 */
export const MAX_PHOTO_DATA_URL = 560_000;

/** Limite máximo de arquivo em bytes (5 MB) — validado no Storage. */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const photoPayloadSchema = z.object({
  dataUrl: z
    .string()
    .max(MAX_PHOTO_DATA_URL, "A foto é muito grande. Tente novamente.")
    .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, "Formato de foto inválido."),
  fileName: z.string().trim().min(1).max(160),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  sizeBytes: z.number().int().min(1).max(MAX_FILE_SIZE),
  width: z.number().int().positive().max(12_000).optional(),
  height: z.number().int().positive().max(12_000).optional(),
});

export type PhotoPayload = z.infer<typeof photoPayloadSchema>;

export const photoBatchSchema = z
  .array(photoPayloadSchema)
  .min(1, "Selecione ao menos uma foto.")
  .max(5, "Envie no máximo 5 fotos por vez.");

/** O anexo é vinculado a exatamente um destino. */
export const photoTargetSchema = z
  .object({
    workOrderId: z.string().trim().min(1).optional(),
    inspectionResponseId: z.string().trim().min(1).optional(),
    assetId: z.string().trim().min(1).optional(),
  })
  .refine(
    (value) =>
      [value.workOrderId, value.inspectionResponseId, value.assetId].filter(Boolean)
        .length === 1,
    "Destino do anexo inválido.",
  );

export type PhotoTarget = z.infer<typeof photoTargetSchema>;
