import "server-only";

import { getStorageClient, isStorageConfigured, STORAGE_BUCKET } from "./client";
import { serviceError, serviceOk, type ServiceResult } from "@/server/services/result";

// Re-exporta funções puras (testáveis sem servidor)
export {
  detectRealMimeType,
  buildStoragePath,
  extractCompanyIdFromPath,
  MAX_FILE_SIZE,
  SIGNED_URL_EXPIRES,
  ALLOWED_MIME,
  type MediaTargetType,
} from "@/lib/storage-utils";

import {
  ALLOWED_MIME,
  buildStoragePath,
  detectRealMimeType,
  MAX_FILE_SIZE,
  type MediaTargetType,
} from "@/lib/storage-utils";

export { isStorageConfigured };

/**
 * Valida o buffer: tamanho, magic bytes e MIME final.
 * Retorna o MIME validado ou um erro descritivo.
 */
function validateBuffer(buffer: Buffer): ServiceResult<string> {
  if (buffer.length === 0) {
    return serviceError("Arquivo vazio.");
  }

  if (buffer.length > MAX_FILE_SIZE) {
    return serviceError(`Arquivo excede o limite de ${Math.round(MAX_FILE_SIZE / 1024 / 1024)} MB.`);
  }

  const realMime = detectRealMimeType(buffer);
  if (!realMime) {
    return serviceError("Formato de arquivo não suportado. Envie JPEG, PNG ou WebP.");
  }

  if (!ALLOWED_MIME[realMime]) {
    return serviceError(`Tipo não permitido: ${realMime}.`);
  }

  return serviceOk(realMime);
}

/**
 * Faz upload de um buffer para o Storage.
 *
 * Valida conteúdo real (magic bytes), tamanho (≤ 5 MB) e gera path no servidor.
 * Em dev sem configuração, retorna o data URL como fallback.
 */
export async function uploadMedia(
  companyId: string,
  type: MediaTargetType,
  entityId: string,
  buffer: Buffer,
  declaredMime: string,
  dataUrlFallback?: string,
): Promise<ServiceResult<{ storagePath: string; mimeType: string; fileSize: number }>> {
  const validated = validateBuffer(buffer);
  if (!validated.ok) return validated;
  const realMime = validated.data;

  // Desenvolvimento sem Supabase configurado: fallback data URL
  if (!isStorageConfigured()) {
    if (process.env.NODE_ENV === "production") {
      return serviceError("Storage não configurado. Contate o suporte.");
    }
    if (!dataUrlFallback) {
      return serviceError("Storage não configurado e nenhum fallback fornecido.");
    }
    return serviceOk({
      storagePath: dataUrlFallback,
      mimeType: realMime,
      fileSize: buffer.length,
    });
  }

  const client = getStorageClient();
  if (!client) {
    return serviceError("Storage não disponível.");
  }

  const ext = ALLOWED_MIME[realMime] ?? ".bin";
  const path = buildStoragePath(companyId, type, entityId, ext);

  const { error: uploadError } = await client.storage
    .from(STORAGE_BUCKET)
    .upload(path, buffer, { contentType: realMime, upsert: false });

  if (uploadError) {
    console.error("uploadMedia", uploadError);
    return serviceError("Falha ao enviar arquivo. Tente novamente.");
  }

  return serviceOk({
    storagePath: path,
    mimeType: realMime,
    fileSize: buffer.length,
  });
}

/**
 * Gera uma URL assinada temporária para o path.
 *
 * Caller DEVE validar que o usuário tem permissão antes de chamar.
 * Retorna o próprio valor se for um data URL (dev fallback).
 */
export async function getSignedMediaUrl(
  storagePath: string,
  expiresInSeconds: number = 3600,
): Promise<ServiceResult<string>> {
  // Data URLs (dev fallback) são usadas diretamente
  if (storagePath.startsWith("data:")) {
    return serviceOk(storagePath);
  }

  const client = getStorageClient();
  if (!client) {
    return serviceError("Storage não disponível.");
  }

  const { data, error } = await client.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data) {
    console.error("getSignedMediaUrl", error);
    return serviceError("Falha ao gerar URL do arquivo.");
  }

  return serviceOk(data.signedUrl);
}

/**
 * Baixa o arquivo do Storage como Buffer.
 * Usado pelo PDF (precisa dos bytes, não da URL).
 */
export async function downloadMedia(
  storagePath: string,
): Promise<ServiceResult<Buffer>> {
  if (storagePath.startsWith("data:")) {
    const base64 = storagePath.slice(storagePath.indexOf(",") + 1);
    return serviceOk(Buffer.from(base64, "base64"));
  }

  const client = getStorageClient();
  if (!client) {
    return serviceError("Storage não disponível.");
  }

  const { data, error } = await client.storage
    .from(STORAGE_BUCKET)
    .download(storagePath);

  if (error || !data) {
    console.error("downloadMedia", error);
    return serviceError("Falha ao baixar arquivo.");
  }

  const arrayBuffer = await data.arrayBuffer();
  return serviceOk(Buffer.from(arrayBuffer));
}

/**
 * Remove um arquivo do Storage.
 * Caller DEVE validar permissões antes de chamar.
 * Data URLs (dev) não têm nada para remover.
 */
export async function deleteMedia(storagePath: string): Promise<ServiceResult> {
  if (storagePath.startsWith("data:")) {
    return serviceOk(undefined);
  }

  const client = getStorageClient();
  if (!client) {
    return serviceError("Storage não disponível.");
  }

  const { error } = await client.storage
    .from(STORAGE_BUCKET)
    .remove([storagePath]);

  if (error) {
    console.error("deleteMedia", error);
    return serviceError("Falha ao remover arquivo.");
  }

  return serviceOk(undefined);
}