import { Prisma } from "@prisma/client";

import { prisma } from "./client";
import { assertTenantOperation } from "./tenant-guard";

export { TENANT_MODELS, TenantIsolationError, assertTenantOperation } from "./tenant-guard";

/**
 * Extensão Prisma que aplica o guard de tenant em todas as operações.
 * Nunca use o client global (`prisma`) para dados de negócio — apenas
 * `createTenantClient(companyId)`.
 */
export function tenantExtension(companyId: string) {
  return Prisma.defineExtension({
    name: "tenant-guard",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          assertTenantOperation(model, operation, args, companyId);
          return query(args);
        },
      },
    },
  });
}

export function createTenantClient(companyId: string) {
  if (!companyId) {
    throw new Error("createTenantClient exige um companyId");
  }
  return prisma.$extends(tenantExtension(companyId));
}

export type TenantClient = ReturnType<typeof createTenantClient>;
