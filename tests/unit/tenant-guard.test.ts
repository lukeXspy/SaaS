import { describe, expect, it } from "vitest";

import { TenantIsolationError, assertTenantOperation } from "@/server/db/tenant";

const COMPANY = "company_a";

function expectBlocked(fn: () => void) {
  expect(fn).toThrow(TenantIsolationError);
}

describe("guard de tenant", () => {
  it("libera leitura com companyId no where", () => {
    expect(() =>
      assertTenantOperation("WorkOrder", "findMany", { where: { companyId: COMPANY } }, COMPANY),
    ).not.toThrow();
  });

  it("bloqueia leitura sem companyId", () => {
    expectBlocked(() => assertTenantOperation("WorkOrder", "findMany", { where: {} }, COMPANY));
    expectBlocked(() => assertTenantOperation("Client", "findFirst", undefined, COMPANY));
  });

  it("aceita companyId dentro de AND", () => {
    expect(() =>
      assertTenantOperation(
        "Asset",
        "findFirst",
        { where: { AND: [{ status: "ACTIVE" }, { companyId: COMPANY }] } },
        COMPANY,
      ),
    ).not.toThrow();
  });

  it("bloqueia OR sem companyId no nível superior", () => {
    expectBlocked(() =>
      assertTenantOperation(
        "Asset",
        "findMany",
        { where: { OR: [{ companyId: COMPANY }, { companyId: "other" }] } },
        COMPANY,
      ),
    );
  });

  it("proíbe findUnique e update/delete unitários", () => {
    expectBlocked(() =>
      assertTenantOperation("WorkOrder", "findUnique", { where: { companyId: COMPANY } }, COMPANY),
    );
    expectBlocked(() =>
      assertTenantOperation("WorkOrder", "update", { where: { companyId: COMPANY } }, COMPANY),
    );
    expectBlocked(() =>
      assertTenantOperation("WorkOrder", "delete", { where: { companyId: COMPANY } }, COMPANY),
    );
  });

  it("exige companyId correto na criação", () => {
    expect(() =>
      assertTenantOperation(
        "Client",
        "create",
        { data: { companyId: COMPANY, name: "ACME" } },
        COMPANY,
      ),
    ).not.toThrow();
    expectBlocked(() =>
      assertTenantOperation(
        "Client",
        "create",
        { data: { companyId: "other", name: "ACME" } },
        COMPANY,
      ),
    );
  });

  it("valida createMany item a item", () => {
    expect(() =>
      assertTenantOperation(
        "Site",
        "createMany",
        { data: [{ companyId: COMPANY }, { companyId: COMPANY }] },
        COMPANY,
      ),
    ).not.toThrow();
    expectBlocked(() =>
      assertTenantOperation(
        "Site",
        "createMany",
        { data: [{ companyId: COMPANY }, { companyId: "other" }] },
        COMPANY,
      ),
    );
  });

  it("bloqueia updateMany sem tenant e troca de empresa", () => {
    expectBlocked(() =>
      assertTenantOperation("WorkOrder", "updateMany", { where: { id: "x" } }, COMPANY),
    );
    expectBlocked(() =>
      assertTenantOperation(
        "WorkOrder",
        "updateMany",
        { where: { companyId: COMPANY }, data: { companyId: "other" } },
        COMPANY,
      ),
    );
  });

  it("ignora modelos que não são de tenant", () => {
    expect(() => assertTenantOperation("Company", "findMany", { where: {} }, COMPANY)).not.toThrow();
  });
});
