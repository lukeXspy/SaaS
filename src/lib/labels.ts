import type {
  AssetCategory,
  AssetStatus,
  AttachmentKind,
  ChecklistItemType,
  Criticality,
  InspectionResult,
  InspectionStatus,
  UserRole,
  WorkOrderItemKind,
  WorkOrderPriority,
  WorkOrderStatus,
  WorkOrderType,
} from "@prisma/client";

/** Tom visual usado por badges e indicadores. */
export type Tone = "neutral" | "info" | "warning" | "success" | "danger";

export const roleLabels: Record<UserRole, string> = {
  ADMIN: "Administrador",
  TECHNICIAN: "Técnico",
};

export const workOrderStatusLabels: Record<WorkOrderStatus, string> = {
  OPEN: "Aberta",
  IN_PROGRESS: "Em andamento",
  WAITING_PARTS: "Aguardando peças",
  DONE: "Concluída",
  CANCELED: "Cancelada",
};

export const workOrderStatusTone: Record<WorkOrderStatus, Tone> = {
  OPEN: "info",
  IN_PROGRESS: "warning",
  WAITING_PARTS: "warning",
  DONE: "success",
  CANCELED: "neutral",
};

export const workOrderTypeLabels: Record<WorkOrderType, string> = {
  CORRECTIVE: "Corretiva",
  PREVENTIVE: "Preventiva",
  INSPECTION: "Inspeção",
};

export const workOrderPriorityLabels: Record<WorkOrderPriority, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  URGENT: "Urgente",
};

export const priorityTone: Record<WorkOrderPriority, Tone> = {
  LOW: "neutral",
  MEDIUM: "info",
  HIGH: "warning",
  URGENT: "danger",
};

export const assetCategoryLabels: Record<AssetCategory, string> = {
  ELECTRICAL: "Elétrica",
  REFRIGERATION: "Refrigeração",
  HVAC: "Climatização",
  AUTOMATION: "Automação",
  MECHANICAL: "Mecânica",
  CIVIL: "Civil",
  OTHER: "Outros",
};

export const assetStatusLabels: Record<AssetStatus, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  DECOMMISSIONED: "Desativado",
};

export const criticalityLabels: Record<Criticality, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  CRITICAL: "Crítica",
};

export const criticalityTone: Record<Criticality, Tone> = {
  LOW: "neutral",
  MEDIUM: "info",
  HIGH: "warning",
  CRITICAL: "danger",
};

export const inspectionStatusLabels: Record<InspectionStatus, string> = {
  PENDING: "Pendente",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluída",
  CANCELED: "Cancelada",
};

export const inspectionStatusTone: Record<InspectionStatus, Tone> = {
  PENDING: "info",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  CANCELED: "neutral",
};

export const inspectionResultLabels: Record<InspectionResult, string> = {
  OK: "Conforme",
  NOT_OK: "Não conforme",
  NA: "N/A",
};

export const checklistItemTypeLabels: Record<ChecklistItemType, string> = {
  TRI_STATE: "Conforme / Não conforme",
  TEXT: "Texto",
  NUMBER: "Número",
  PHOTO: "Foto",
};

export const workOrderItemKindLabels: Record<WorkOrderItemKind, string> = {
  SERVICE: "Serviço",
  PART: "Peça",
};

export const attachmentKindLabels: Record<AttachmentKind, string> = {
  PHOTO: "Foto",
  SIGNATURE: "Assinatura",
  DOCUMENT: "Documento",
};

type Option<T extends string> = { value: T; label: string };

function toOptions<T extends string>(labels: Record<T, string>): Option<T>[] {
  return (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));
}

export const workOrderStatusOptions = toOptions(workOrderStatusLabels);
export const workOrderTypeOptions = toOptions(workOrderTypeLabels);
export const workOrderPriorityOptions = toOptions(workOrderPriorityLabels);
export const assetCategoryOptions = toOptions(assetCategoryLabels);
export const criticalityOptions = toOptions(criticalityLabels);
export const inspectionResultOptions = toOptions(inspectionResultLabels);
export const checklistItemTypeOptions = toOptions(checklistItemTypeLabels);
export const workOrderItemKindOptions = toOptions(workOrderItemKindLabels);
export const roleOptions = toOptions(roleLabels);
