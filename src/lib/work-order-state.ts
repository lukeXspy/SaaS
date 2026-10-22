import type { UserRole, WorkOrderStatus } from "@prisma/client";

/**
 * Transições permitidas da ordem de serviço (regra de negócio central).
 * Técnico tem restrições adicionais: não cancela e não reabre.
 */
const TRANSITIONS: Record<WorkOrderStatus, readonly WorkOrderStatus[]> = {
  OPEN: ["IN_PROGRESS", "CANCELED"],
  IN_PROGRESS: ["WAITING_PARTS", "DONE", "CANCELED"],
  WAITING_PARTS: ["IN_PROGRESS", "CANCELED"],
  DONE: ["OPEN"],
  CANCELED: [],
};

export type TransitionActor = { role: UserRole };

export function canTransition(
  from: WorkOrderStatus,
  to: WorkOrderStatus,
  actor: TransitionActor,
): boolean {
  if (!TRANSITIONS[from].includes(to)) return false;

  if (actor.role === "TECHNICIAN") {
    if (to === "CANCELED") return false;
    if (from === "DONE" && to === "OPEN") return false;
  }

  return true;
}

export function isTerminalStatus(status: WorkOrderStatus): boolean {
  return status === "CANCELED";
}
