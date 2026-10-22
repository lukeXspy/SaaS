/**
 * Guard de isolamento multi-tenant.
 *
 * Regras aplicadas a todo modelo de negócio:
 * - leituras e operações em lote exigem companyId no `where`;
 * - criação exige companyId igual ao tenant da sessão;
 * - operações por id único são proibidas (use updateMany/deleteMany + companyId).
 *
 * O guard é a última linha de defesa: os serviços já filtram por tenant e
 * retornam 404 para registros de outra empresa.
 */

export const TENANT_MODELS = new Set<string>([
  "User",
  "Client",
  "Site",
  "Asset",
  "ChecklistTemplate",
  "ChecklistTemplateItem",
  "WorkOrder",
  "WorkOrderStatusHistory",
  "WorkOrderExecution",
  "WorkOrderItem",
  "Inspection",
  "InspectionResponse",
  "Attachment",
  "Invite",
  "PasswordResetToken",
]);

const READ_OPERATIONS = new Set([
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
]);

const CREATE_OPERATIONS = new Set(["create"]);
const CREATE_MANY_OPERATIONS = new Set(["createMany"]);
const UPDATE_MANY_OPERATIONS = new Set(["updateMany"]);
const DELETE_MANY_OPERATIONS = new Set(["deleteMany"]);

export class TenantIsolationError extends Error {
  override readonly name = "TenantIsolationError";

  constructor(
    readonly model: string,
    readonly operation: string,
    reason: string,
  ) {
    super(`[tenant-guard] ${model}.${operation} bloqueado: ${reason}`);
  }
}

type Obj = Record<string, unknown>;

function isObject(value: unknown): value is Obj {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasTenantInWhere(where: unknown, companyId: string): boolean {
  if (!isObject(where)) return false;
  if (where.companyId === companyId) return true;

  const and = where.AND;
  if (Array.isArray(and)) {
    return and.some((entry) => hasTenantInWhere(entry, companyId));
  }
  if (isObject(and)) {
    return hasTenantInWhere(and, companyId);
  }

  return false;
}

function assertCompanyId(value: unknown, companyId: string, model: string, operation: string) {
  if (value !== companyId) {
    throw new TenantIsolationError(model, operation, "companyId ausente ou diferente do tenant");
  }
}

export function assertTenantOperation(
  model: string,
  operation: string,
  args: unknown,
  companyId: string,
): void {
  if (!TENANT_MODELS.has(model)) return;

  if (!companyId) {
    throw new TenantIsolationError(model, operation, "tenant vazio");
  }

  const payload = isObject(args) ? args : {};

  if (READ_OPERATIONS.has(operation)) {
    if (!hasTenantInWhere(payload.where, companyId)) {
      throw new TenantIsolationError(model, operation, "where sem companyId do tenant");
    }
    return;
  }

  if (CREATE_OPERATIONS.has(operation)) {
    const data = payload.data;
    if (!isObject(data)) {
      throw new TenantIsolationError(model, operation, "data ausente");
    }
    assertCompanyId(data.companyId, companyId, model, operation);
    return;
  }

  if (CREATE_MANY_OPERATIONS.has(operation)) {
    const rows = Array.isArray(payload.data) ? payload.data : [payload.data];
    if (rows.length === 0) {
      throw new TenantIsolationError(model, operation, "data vazio");
    }
    for (const row of rows) {
      if (!isObject(row)) {
        throw new TenantIsolationError(model, operation, "data inválido");
      }
      assertCompanyId(row.companyId, companyId, model, operation);
    }
    return;
  }

  if (UPDATE_MANY_OPERATIONS.has(operation)) {
    if (!hasTenantInWhere(payload.where, companyId)) {
      throw new TenantIsolationError(model, operation, "where sem companyId do tenant");
    }
    const data = payload.data;
    if (isObject(data) && data.companyId !== undefined) {
      assertCompanyId(data.companyId, companyId, model, operation);
    }
    return;
  }

  if (DELETE_MANY_OPERATIONS.has(operation)) {
    if (!hasTenantInWhere(payload.where, companyId)) {
      throw new TenantIsolationError(model, operation, "where sem companyId do tenant");
    }
    return;
  }

  throw new TenantIsolationError(
    model,
    operation,
    "operação não permitida (use findMany/findFirst, create, updateMany ou deleteMany)",
  );
}
