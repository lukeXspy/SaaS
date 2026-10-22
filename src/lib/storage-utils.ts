/**
 * Funções puras de Storage — sem dependências de servidor.
 * Podem ser importadas em testes unitários.
 */

import { randomUUID } from "node:crypto";

/** Limite máximo de arquivo em bytes (5 MB). */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Duração da URL assinada em segundos (1 hora). */
export const SIGNED_URL_EXPIRES = 3600;

/** MIME types permitidos e suas extensões. */
export const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export type MediaTargetType = "work-orders" | "inspections" | "signatures" | "assets";

/**
 * Detecta o MIME real do arquivo lendo os primeiros bytes (magic bytes).
 * Retorna null se o formato não for reconhecido ou permitido.
 */
export function detectRealMimeType(buffer: Buffer): string | null {
  // JPEG: FF D8 FF
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  // WebP: RIFF .... WEBP
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && // R
    buffer[1] === 0x49 && // I
    buffer[2] === 0x46 && // F
    buffer[3] === 0x46 && // F
    buffer[8] === 0x57 && // W
    buffer[9] === 0x45 && // E
    buffer[10] === 0x42 && // B
    buffer[11] === 0x50 // P
  ) {
    return "image/webp";
  }

  return null;
}

/**
 * Gera um path seguro para o Storage.
 * Sempre chamado no servidor — o cliente nunca fornece o path.
 *
 * Formato: {companyId}/{type}/{entityId}/{uuid}.{ext}
 */
export function buildStoragePath(
  companyId: string,
  type: MediaTargetType,
  entityId: string,
  extension: string,
): string {
  const uuid = randomUUID();
  const ext = extension.startsWith(".") ? extension : `.${extension}`;
  return `${companyId}/${type}/${entityId}/${uuid}${ext}`;
}

/**
 * Extrai o companyId do path (primeiro segmento).
 * Usado como verificação adicional (defense in depth), mas o isolamento
 * principal é feito pelos services que validam sessão + permissão.
 */
export function extractCompanyIdFromPath(path: string): string | null {
  const idx = path.indexOf("/");
  if (idx <= 0) return null;
  return path.slice(0, idx);
}
