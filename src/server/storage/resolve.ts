import "server-only";

import type { UserRole } from "@prisma/client";

import { getSessionUser, type SessionUser } from "@/server/auth/session";
import { createTenantClient } from "@/server/db/tenant";
import { downloadMedia, getSignedMediaUrl } from "./media";
import { serviceError, type ServiceResult } from "@/server/services/result";

type Actor = { userId: string; role: UserRole; companyId: string };

/**
 * Helpers para resolver mídia (fotos, assinaturas) de forma segura.
 *
 * O isolamento é feito em DUAS camadas:
 * 1. A query Prisma é sempre escopada por companyId (tenant guard).
 * 2. Para técnicos, verificamos que a OS/inspeção está atribuída a eles.
 *
 * O prefixo companyId/ no path é apenas defense in depth — nunca a única barreira.
 */

/**
 * Valida que o actor pode acessar a OS especificada.
 * - ADMIN: qualquer OS da própria empresa.
 * - TECHNICIAN: apenas OS atribuídas a ele.
 */
async function canAccessWorkOrder(
  actor: Actor,
  workOrderId: string,
): Promise<boolean> {
  const db = createTenantClient(actor.companyId);
  const wo = await db.workOrder.findFirst({
    where: { id: workOrderId, companyId: actor.companyId },
    select: { assignedToId: true },
  });
  if (!wo) return false;
  if (actor.role === "TECHNICIAN" && wo.assignedToId !== actor.userId) return false;
  return true;
}

/**
 * Valida que o actor pode acessar a inspeção especificada.
 * - ADMIN: qualquer inspeção da própria empresa.
 * - TECHNICIAN: apenas inspeções atribuídas a ele.
 */
async function canAccessInspection(
  actor: Actor,
  inspectionId: string,
): Promise<boolean> {
  const db = createTenantClient(actor.companyId);
  const insp = await db.inspection.findFirst({
    where: { id: inspectionId, companyId: actor.companyId },
    select: { technicianId: true },
  });
  if (!insp) return false;
  if (actor.role === "TECHNICIAN" && insp.technicianId !== actor.userId) return false;
  return true;
}

/**
 * Resolve a URL assinada de uma foto de OS.
 * Valida sessão, tenant e permissão antes de gerar a URL.
 */
export async function resolveWorkOrderPhotoUrl(
  workOrderId: string,
  attachmentId: string,
): Promise<ServiceResult<string>> {
  const user = await getSessionUser();
  if (!user) return serviceError("Não autenticado.");

  const actor: Actor = { userId: user.id, role: user.role, companyId: user.companyId };

  const allowed = await canAccessWorkOrder(actor, workOrderId);
  if (!allowed) return serviceError("Não encontrado.");

  const db = createTenantClient(actor.companyId);
  const attachment = await db.attachment.findFirst({
    where: {
      id: attachmentId,
      companyId: actor.companyId,
      workOrderId,
      kind: "PHOTO",
    },
    select: { storagePath: true },
  });
  if (!attachment) return serviceError("Não encontrado.");

  return getSignedMediaUrl(attachment.storagePath);
}

/**
 * Resolve a URL assinada da assinatura de uma OS.
 */
export async function resolveWorkOrderSignatureUrl(
  workOrderId: string,
): Promise<ServiceResult<string>> {
  const user = await getSessionUser();
  if (!user) return serviceError("Não autenticado.");

  const actor: Actor = { userId: user.id, role: user.role, companyId: user.companyId };

  const allowed = await canAccessWorkOrder(actor, workOrderId);
  if (!allowed) return serviceError("Não encontrado.");

  const db = createTenantClient(actor.companyId);
  const execution = await db.workOrderExecution.findFirst({
    where: { workOrderId, companyId: actor.companyId },
    select: { signatureUrl: true },
  });
  if (!execution?.signatureUrl) return serviceError("Assinatura não encontrada.");

  return getSignedMediaUrl(execution.signatureUrl);
}

/**
 * Resolve a URL assinada de uma foto de resposta de inspeção.
 */
export async function resolveInspectionPhotoUrl(
  inspectionId: string,
  attachmentId: string,
): Promise<ServiceResult<string>> {
  const user = await getSessionUser();
  if (!user) return serviceError("Não autenticado.");

  const actor: Actor = { userId: user.id, role: user.role, companyId: user.companyId };

  const allowed = await canAccessInspection(actor, inspectionId);
  if (!allowed) return serviceError("Não encontrado.");

  const db = createTenantClient(actor.companyId);
  const attachment = await db.attachment.findFirst({
    where: {
      id: attachmentId,
      companyId: actor.companyId,
      inspectionId,
      kind: "PHOTO",
    },
    select: { storagePath: true },
  });
  if (!attachment) return serviceError("Não encontrado.");

  return getSignedMediaUrl(attachment.storagePath);
}

/**
 * Baixa os bytes de uma foto de OS (para PDF).
 * Valida sessão, tenant e permissão.
 */
export async function downloadWorkOrderPhoto(
  sessionUser: SessionUser,
  workOrderId: string,
  attachmentId: string,
): Promise<ServiceResult<Buffer>> {
  const actor: Actor = {
    userId: sessionUser.id,
    role: sessionUser.role,
    companyId: sessionUser.companyId,
  };

  const allowed = await canAccessWorkOrder(actor, workOrderId);
  if (!allowed) return serviceError("Não encontrado.");

  const db = createTenantClient(actor.companyId);
  const attachment = await db.attachment.findFirst({
    where: {
      id: attachmentId,
      companyId: actor.companyId,
      workOrderId,
      kind: "PHOTO",
    },
    select: { storagePath: true },
  });
  if (!attachment) return serviceError("Não encontrado.");

  return downloadMedia(attachment.storagePath);
}

/**
 * Baixa os bytes da assinatura de uma OS (para PDF).
 */
export async function downloadWorkOrderSignature(
  sessionUser: SessionUser,
  workOrderId: string,
): Promise<ServiceResult<Buffer>> {
  const actor: Actor = {
    userId: sessionUser.id,
    role: sessionUser.role,
    companyId: sessionUser.companyId,
  };

  const allowed = await canAccessWorkOrder(actor, workOrderId);
  if (!allowed) return serviceError("Não encontrado.");

  const db = createTenantClient(actor.companyId);
  const execution = await db.workOrderExecution.findFirst({
    where: { workOrderId, companyId: actor.companyId },
    select: { signatureUrl: true },
  });
  if (!execution?.signatureUrl) return serviceError("Assinatura não encontrada.");

  return downloadMedia(execution.signatureUrl);
}

// ─────────────────────────────────────────────────────────────
// Helpers para Server Components
// Recebem dados já escopados por tenant e resolvem URLs assinadas.
// ─────────────────────────────────────────────────────────────

export type ResolvedPhoto = { id: string; url: string; fileName: string };

/**
 * Resolve URLs assinadas para uma lista de anexos.
 * Assume que o caller já validou permissões (página escopada por tenant).
 * Se um anexo falhar, é omitido (não quebra a página inteira).
 */
export async function resolveAttachmentUrls(
  attachments: { id: string; storagePath: string; fileName: string }[],
): Promise<ResolvedPhoto[]> {
  const resolved: ResolvedPhoto[] = [];
  for (const att of attachments) {
    const result = await getSignedMediaUrl(att.storagePath);
    if (result.ok) {
      resolved.push({ id: att.id, url: result.data, fileName: att.fileName });
    }
  }
  return resolved;
}

/**
 * Resolve a URL assinada da assinatura de uma execução de OS.
 * Retorna null se não houver assinatura.
 */
export async function resolveExecutionSignatureUrl(
  signatureUrl: string | null,
): Promise<string | null> {
  if (!signatureUrl) return null;
  const result = await getSignedMediaUrl(signatureUrl);
  return result.ok ? result.data : null;
}
