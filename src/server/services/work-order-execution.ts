import type { Prisma, UserRole, WorkOrderStatus } from "@prisma/client";

import { canTransition } from "@/lib/work-order-state";
import type {
  CompleteWorkOrderInput,
  ExecutionInput,
  WorkOrderItemInput,
} from "@/lib/validation/work-orders";
import { createTenantClient } from "@/server/db/tenant";
import { serviceError, serviceOk, type ServiceResult } from "./result";

type Actor = { userId: string; role: UserRole };

function assertScope(actor: Actor, assignedToId: string | null): boolean {
  return actor.role === "ADMIN" || assignedToId === actor.userId;
}

type TransitionOptions = { note?: string; cancelReason?: string };

export async function transitionWorkOrder(
  companyId: string,
  id: string,
  to: WorkOrderStatus,
  actor: Actor,
  options: TransitionOptions = {},
): Promise<ServiceResult> {
  const db = createTenantClient(companyId);

  const current = await db.workOrder.findFirst({
    where: { companyId, id },
    select: { id: true, status: true, assignedToId: true, startedAt: true },
  });
  if (!current) return serviceError("OS não encontrada.");
  if (!assertScope(actor, current.assignedToId)) return serviceError("OS não encontrada.");

  if (to === "DONE") {
    return serviceError("Conclua a OS pela tela de conclusão, com a assinatura do cliente.");
  }

  if (!canTransition(current.status, to, { role: actor.role })) {
    return serviceError("Esta mudança de status não é permitida.");
  }

  const cancelReason = options.cancelReason?.trim();
  if (to === "CANCELED" && !cancelReason) {
    return serviceError("Informe o motivo do cancelamento.");
  }

  const now = new Date();
  const data: Prisma.WorkOrderUpdateManyMutationInput = { status: to };

  if (to === "IN_PROGRESS") {
    data.startedAt = current.startedAt ?? now;
  }
  if (to === "CANCELED") {
    data.canceledAt = now;
    data.cancelReason = cancelReason;
  }
  if (to === "OPEN") {
    data.completedAt = null;
    data.canceledAt = null;
    data.cancelReason = null;
  }

  const updated = await db.workOrder.updateMany({
    where: { companyId, id, status: current.status },
    data,
  });
  if (updated.count === 0) {
    return serviceError("A OS foi alterada por outra pessoa. Recarregue a página.");
  }

  await db.workOrderStatusHistory.create({
    data: {
      companyId,
      workOrderId: id,
      fromStatus: current.status,
      toStatus: to,
      changedById: actor.userId,
      note: options.note?.trim() || null,
    },
  });

  if (to === "IN_PROGRESS") {
    const execution = await db.workOrderExecution.findFirst({
      where: { companyId, workOrderId: id },
      select: { id: true, startedAt: true },
    });

    if (execution) {
      if (!execution.startedAt) {
        await db.workOrderExecution.updateMany({
          where: { companyId, id: execution.id },
          data: { startedAt: now },
        });
      }
    } else {
      await db.workOrderExecution.create({
        data: {
          companyId,
          workOrderId: id,
          technicianId: current.assignedToId ?? actor.userId,
          startedAt: now,
        },
      });
    }
  }

  if (to === "OPEN") {
    await db.workOrderExecution.updateMany({
      where: { companyId, workOrderId: id },
      data: { finishedAt: null },
    });
  }

  return serviceOk(undefined);
}

type LoadedWorkOrder =
  | { ok: false; error: string }
  | {
      ok: true;
      workOrder: {
        id: string;
        status: WorkOrderStatus;
        assignedToId: string | null;
        startedAt: Date | null;
      };
    };

async function loadEditableWorkOrder(
  companyId: string,
  id: string,
  actor: Actor,
): Promise<LoadedWorkOrder> {
  const db = createTenantClient(companyId);
  const workOrder = await db.workOrder.findFirst({
    where: { companyId, id },
    select: { id: true, status: true, assignedToId: true, startedAt: true },
  });
  if (!workOrder) return { ok: false, error: "OS não encontrada." };
  if (!assertScope(actor, workOrder.assignedToId)) {
    return { ok: false, error: "OS não encontrada." };
  }
  if (workOrder.status === "DONE" || workOrder.status === "CANCELED") {
    return { ok: false, error: "Esta OS está finalizada e não pode mais ser alterada." };
  }
  return { ok: true, workOrder };
}

export async function saveExecution(
  companyId: string,
  workOrderId: string,
  actor: Actor,
  data: ExecutionInput,
): Promise<ServiceResult> {
  const loaded = await loadEditableWorkOrder(companyId, workOrderId, actor);
  if (!loaded.ok) return serviceError(loaded.error);

  const db = createTenantClient(companyId);
  const technicianId = loaded.workOrder.assignedToId ?? actor.userId;

  const execution = await db.workOrderExecution.findFirst({
    where: { companyId, workOrderId },
    select: { id: true },
  });

  if (!execution) {
    await db.workOrderExecution.create({
      data: {
        companyId,
        workOrderId,
        technicianId,
        startedAt: loaded.workOrder.startedAt ?? new Date(),
        diagnosis: data.diagnosis ?? null,
        solution: data.solution ?? null,
        observations: data.observations ?? null,
        laborMinutes: data.laborMinutes ?? null,
      },
    });
    return serviceOk(undefined);
  }

  await db.workOrderExecution.updateMany({
    where: { companyId, workOrderId },
    data: {
      diagnosis: data.diagnosis ?? null,
      solution: data.solution ?? null,
      observations: data.observations ?? null,
      laborMinutes: data.laborMinutes ?? null,
    },
  });

  return serviceOk(undefined);
}

export async function addWorkOrderItem(
  companyId: string,
  workOrderId: string,
  actor: Actor,
  data: WorkOrderItemInput,
): Promise<ServiceResult> {
  const loaded = await loadEditableWorkOrder(companyId, workOrderId, actor);
  if (!loaded.ok) return serviceError(loaded.error);

  const db = createTenantClient(companyId);
  const position = await db.workOrderItem.count({ where: { companyId, workOrderId } });

  await db.workOrderItem.create({
    data: {
      companyId,
      workOrderId,
      kind: data.kind,
      description: data.description,
      quantity: data.quantity,
      unit: data.unit ?? null,
      notes: data.notes ?? null,
      position,
    },
  });

  return serviceOk(undefined);
}

export async function deleteWorkOrderItem(
  companyId: string,
  workOrderId: string,
  itemId: string,
  actor: Actor,
): Promise<ServiceResult> {
  const loaded = await loadEditableWorkOrder(companyId, workOrderId, actor);
  if (!loaded.ok) return serviceError(loaded.error);

  const db = createTenantClient(companyId);
  const deleted = await db.workOrderItem.deleteMany({
    where: { companyId, workOrderId, id: itemId },
  });

  return deleted.count > 0 ? serviceOk(undefined) : serviceError("Item não encontrado.");
}

export async function completeWorkOrder(
  companyId: string,
  id: string,
  actor: Actor,
  input: CompleteWorkOrderInput,
): Promise<ServiceResult> {
  const db = createTenantClient(companyId);

  const workOrder = await db.workOrder.findFirst({
    where: { companyId, id },
    select: { status: true, assignedToId: true, startedAt: true },
  });
  if (!workOrder) return serviceError("OS não encontrada.");
  if (!assertScope(actor, workOrder.assignedToId)) return serviceError("OS não encontrada.");
  if (workOrder.status !== "IN_PROGRESS") {
    return serviceError("A OS precisa estar em andamento para ser concluída.");
  }

  const execution = await db.workOrderExecution.findFirst({
    where: { companyId, workOrderId: id },
    select: { id: true, startedAt: true, laborMinutes: true },
  });
  if (!execution) {
    return serviceError("Inicie a OS antes de concluir.");
  }

  const now = new Date();
  const startedAt = execution.startedAt ?? workOrder.startedAt;
  const laborMinutes =
    execution.laborMinutes ??
    (startedAt ? Math.max(1, Math.round((now.getTime() - startedAt.getTime()) / 60000)) : null);

  const updated = await db.workOrder.updateMany({
    where: { companyId, id, status: "IN_PROGRESS" },
    data: { status: "DONE", completedAt: now },
  });
  if (updated.count === 0) {
    return serviceError("A OS foi alterada por outra pessoa. Recarregue a página.");
  }

  await db.workOrderExecution.updateMany({
    where: { companyId, workOrderId: id },
    data: {
      finishedAt: now,
      laborMinutes,
      signedByName: input.signedByName,
      signedAt: now,
      signatureUrl: input.signatureDataUrl,
      ...(input.observations ? { observations: input.observations } : {}),
    },
  });

  await db.workOrderStatusHistory.create({
    data: {
      companyId,
      workOrderId: id,
      fromStatus: "IN_PROGRESS",
      toStatus: "DONE",
      changedById: actor.userId,
      note: `OS concluída. Assinatura: ${input.signedByName}.`,
    },
  });

  return serviceOk(undefined);
}
