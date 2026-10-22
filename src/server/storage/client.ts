import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase Storage — sempre server-side.
 * Usa SERVICE_ROLE_KEY (nunca exposta ao browser).
 */

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "manutenza-media";

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * true se o Storage está configurado e pronto para uso.
 * Em produção, configuração ausente falha explicitamente em getStorageClient().
 */
export function isStorageConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

let cachedClient: SupabaseClient | null = null;

/**
 * Retorna o cliente Supabase Storage.
 *
 * - Em produção: exige SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY; ausência = erro.
 * - Em desenvolvimento: retorna null se não configurado (caller usa fallback).
 *
 * O path sempre inclui companyId/ como primeiro segmento, mas o isolamento
 * de verdade é feito pelos services/actions (verificação de sessão, tenant
 * e permissão sobre a OS/inspeção) — nunca apenas pelo prefixo do path.
 */
export function getStorageClient(): SupabaseClient | null {
  if (!isStorageConfigured()) {
    if (isProduction()) {
      throw new Error(
        "SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios em produção.",
      );
    }
    return null;
  }

  if (!cachedClient) {
    cachedClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return cachedClient;
}
