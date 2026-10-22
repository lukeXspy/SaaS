import { describe, expect, it } from "vitest";

import { canTransition, isTerminalStatus } from "@/lib/work-order-state";

describe("transições de ordem de serviço", () => {
  const admin = { role: "ADMIN" } as const;
  const tech = { role: "TECHNICIAN" } as const;

  it("permite iniciar uma OS aberta (admin e técnico)", () => {
    expect(canTransition("OPEN", "IN_PROGRESS", admin)).toBe(true);
    expect(canTransition("OPEN", "IN_PROGRESS", tech)).toBe(true);
  });

  it("não permite pular de aberta direto para concluída", () => {
    expect(canTransition("OPEN", "DONE", admin)).toBe(false);
    expect(canTransition("OPEN", "IN_PROGRESS", tech)).toBe(true);
  });

  it("permite aguardar peças e retomar", () => {
    expect(canTransition("IN_PROGRESS", "WAITING_PARTS", tech)).toBe(true);
    expect(canTransition("WAITING_PARTS", "IN_PROGRESS", tech)).toBe(true);
  });

  it("conclui apenas a partir de em andamento", () => {
    expect(canTransition("IN_PROGRESS", "DONE", tech)).toBe(true);
    expect(canTransition("WAITING_PARTS", "DONE", admin)).toBe(false);
  });

  it("só admin reabre uma OS concluída", () => {
    expect(canTransition("DONE", "OPEN", admin)).toBe(true);
    expect(canTransition("DONE", "OPEN", tech)).toBe(false);
  });

  it("técnico não cancela OS", () => {
    expect(canTransition("OPEN", "CANCELED", admin)).toBe(true);
    expect(canTransition("OPEN", "CANCELED", tech)).toBe(false);
    expect(canTransition("IN_PROGRESS", "CANCELED", tech)).toBe(false);
  });

  it("cancelada é terminal", () => {
    expect(isTerminalStatus("CANCELED")).toBe(true);
    expect(canTransition("CANCELED", "OPEN", admin)).toBe(false);
    expect(canTransition("CANCELED", "IN_PROGRESS", admin)).toBe(false);
  });

  it("não permite transição para o mesmo status", () => {
    expect(canTransition("OPEN", "OPEN", admin)).toBe(false);
  });
});
