import type { UserRole } from "@prisma/client";

import type { PhotoPayload, PhotoTarget } from "@/lib/validation/photos";
import { createTenantClient } from "@/server/db/tenant";
import { deleteMedia, uploadMedia, type MediaTargetType } from "@/server/storage/media";
import { serviceError, serviceOk, type ServiceResult } from "./result";

type Actor = { userId: string; role: UserRole };

const MAX_PHOTOS = 8;

/**
 * Determina o tipo de path e o entityId para o Storage.
 * O path é sempre gerado no servidor — o cliente nunca o fornece.
 */
function targetToStoragePath(
  target: PhotoTarget,
  inspectionId: string | null,
): { type: MediaTargetType; entityId: string } | null {
  if (target.workOrderId) {
    return { type: "work-orders", entityId: target.workOrderId };
  }
  if (target.inspectionResponseId && inspectionId) {
    return { type: "inspections", entityId: inspectionId };
  }
  if (target.assetId) {
    return { type: "assets", entityId: target.assetId };
  }
  return null;
}

/**
 * Decodifica um data URL base64 para Buffer.
 */
function decodeDataUrl(dataUrl: string): Buffer | null {
  const match = dataUrl.match(/^data:image\/[a-z]+;base64,(.+)$/);
  const base64 = match?.[1];
  if (!base64) return null;
  try {
    return Buffer.from(base64, "base64");
  } catch {
    return null;
  }
}

export async function addPhotos(
  companyId: string,
  actor: Actor,
  target: PhotoTarget,
  photos: PhotoPayload[],
): Promise<ServiceResult> {
  const db = createTenantClient(companyId);

  const link = await resolveTarget(companyId, actor, target);
  if (!link.ok) return link;

  const current = await db.attachment.count({
    where: {
      companyId,
      ...(target.workOrderId ? { workOrderId: target.workOrderId } : {}),
      ...(target.inspectionResponseId
        ? { inspectionResponseId: target.inspectionResponseId }
        : {}),
      ...(target.assetId ? { assetId: target.assetId } : {}),
    },
  });

  if (current + photos.length > MAX_PHOTOS) {
    return serviceError(`Cada registro aceita no máximo ${MAX_PHOTOS} fotos.`);
  }

  const storageTarget = targetToStoragePath(target, link.data.inspectionId);
  if (!storageTarget) {
    return serviceError("Destino do anexo inválido.");
  }

  // Processa cada foto: decodifica → valida magic bytes → uploada → registra
  for (const photo of photos) {
    const buffer = decodeDataUrl(photo.dataUrl);
    if (!buffer) {
      return serviceError("Formato de foto inválido.");
    }

    const upload = await uploadMedia(
      companyId,
      storageTarget.type,
      storageTarget.entityId,
      buffer,
      photo.mimeType,
      // Dev fallback: se Storage não configurado, usa o data URL original
      photo.dataUrl,
    );
    if (!upload.ok) return upload;

    await db.attachment.create({
      data: {
        companyId,
        kind: "PHOTO" as const,
        storagePath: upload.data.storagePath,
        fileName: photo.fileName,
        mimeType: upload.data.mimeType,
        fileSize: upload.data.fileSize,
        width: photo.width ?? null,
        height: photo.height ?? null,
        uploadedById: actor.userId,
        ...(target.workOrderId ? { workOrderId: target.workOrderId } : {}),
        ...(target.inspectionResponseId
          ? {
              inspectionResponseId: target.inspectionResponseId,
              inspectionId: link.data.inspectionId,
            }
          : {}),
        ...(target.assetId ? { assetId: target.assetId } : {}),
      },
    });
  }

  return serviceOk(undefined);
}

async function resolveTarget(
  companyId: string,
  actor: Actor,
  target: PhotoTarget,
): Promise<ServiceResult<{ inspectionId: string | null }>> {
  const db = createTenantClient(companyId);

  if (target.workOrderId) {
    const workOrder = await db.workOrder.findFirst({
      where: { companyId, id: target.workOrderId },
      select: { assignedToId: true, status: true },
    });
    if (!workOrder) return serviceError("OS não encontrada.");
    if (actor.role === "TECHNICIAN" && workOrder.assignedToId !== actor.userId) {
      return serviceError("OS não encontrada.");
    }
    if (workOrder.status === "DONE" || workOrder.status === "CANCELED") {
      return serviceError("Esta OS está finalizada e não aceita novas fotos.");
    }
    return serviceOk({ inspectionId: null });
  }

  if (target.inspectionResponseId) {
    const response = await db.inspectionResponse.findFirst({
      where: { companyId, id: target.inspectionResponseId },
      select: {
        inspectionId: true,
        inspection: { select: { technicianId: true, status: true } },
      },
    });
    if (!response) return serviceError("Item da inspeção não encontrado.");
    if (actor.role === "TECHNICIAN" && response.inspection.technicianId !== actor.userId) {
      return serviceError("Item da inspeção não encontrado.");
    }
    if (
      response.inspection.status === "COMPLETED" ||
      response.inspection.status === "CANCELED"
    ) {
      return serviceError("Esta inspeção está finalizada e não aceita novas fotos.");
    }
    return serviceOk({ inspectionId: response.inspectionId });
  }

  if (target.assetId) {
    if (actor.role !== "ADMIN") return serviceError("Acesso negado.");
    const asset = await db.asset.findFirst({
      where: { companyId, id: target.assetId },
      select: { id: true },
    });
    if (!asset) return serviceError("Ativo não encontrado.");
    return serviceOk({ inspectionId: null });
  }

  return serviceError("Destino do anexo inválido.");
}

export async function deletePhoto(
  companyId: string,
  actor: Actor,
  attachmentId: string,
): Promise<ServiceResult> {
  const db = createTenantClient(companyId);
  const attachment = await db.attachment.findFirst({
    where: { companyId, id: attachmentId, kind: "PHOTO" },
    select: {
      id: true,
      storagePath: true,
      workOrderId: true,
      inspectionResponseId: true,
      assetId: true,
    },
  });
  if (!attachment) return serviceError("Foto não encontrada.");

  if (attachment.workOrderId) {
    const workOrder = await db.workOrder.findFirst({
      where: { companyId, id: attachment.workOrderId },
      select: { assignedToId: true, status: true },
    });
    if (!workOrder) return serviceError("Foto não encontrada.");
    if (actor.role === "TECHNICIAN" && workOrder.assignedToId !== actor.userId) {
      return serviceError("Foto não encontrada.");
    }
    if (workOrder.status === "DONE" || workOrder.status === "CANCELED") {
      return serviceError("Esta OS está finalizada e não permite remover fotos.");
    }
  } else if (attachment.inspectionResponseId) {
    const response = await db.inspectionResponse.findFirst({
      where: { companyId, id: attachment.inspectionResponseId },
      select: { inspection: { select: { technicianId: true, status: true } } },
    });
    if (!response) return serviceError("Foto não encontrada.");
    if (actor.role === "TECHNICIAN" && response.inspection.technicianId !== actor.userId) {
      return serviceError("Foto não encontrada.");
    }
    if (
      response.inspection.status === "COMPLETED" ||
      response.inspection.status === "CANCELED"
    ) {
      return serviceError("Esta inspeção está finalizada e não permite remover fotos.");
    }
  } else if (attachment.assetId) {
    if (actor.role !== "ADMIN") return serviceError("Acesso negado.");
  }

  const deleted = await db.attachment.deleteMany({
    where: { companyId, id: attachmentId },
  });
  if (deleted.count === 0) return serviceError("Foto não encontrada.");

  // Remove do Storage (best-effort; se falhar, o registro já saiu do banco)
  await deleteMedia(attachment.storagePath);

  return serviceOk(undefined);
}