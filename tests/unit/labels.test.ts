import { describe, expect, it } from "vitest";

import {
  assetCategoryLabels,
  criticalityLabels,
  inspectionResultLabels,
  priorityTone,
  roleLabels,
  workOrderStatusLabels,
  workOrderStatusOptions,
  workOrderTypeLabels,
} from "@/lib/labels";

describe("rótulos pt-BR", () => {
  it("traduz todos os status de OS", () => {
    expect(workOrderStatusLabels).toEqual({
      OPEN: "Aberta",
      IN_PROGRESS: "Em andamento",
      WAITING_PARTS: "Aguardando peças",
      DONE: "Concluída",
      CANCELED: "Cancelada",
    });
  });

  it("traduz tipos e prioridades", () => {
    expect(workOrderTypeLabels.CORRECTIVE).toBe("Corretiva");
    expect(workOrderTypeLabels.PREVENTIVE).toBe("Preventiva");
    expect(workOrderTypeLabels.INSPECTION).toBe("Inspeção");
    expect(priorityTone.URGENT).toBe("danger");
  });

  it("traduz perfis, categorias e resultados", () => {
    expect(roleLabels.ADMIN).toBe("Administrador");
    expect(roleLabels.TECHNICIAN).toBe("Técnico");
    expect(assetCategoryLabels.REFRIGERATION).toBe("Refrigeração");
    expect(criticalityLabels.CRITICAL).toBe("Crítica");
    expect(inspectionResultLabels.NOT_OK).toBe("Não conforme");
  });

  it("gera opções de select sem perder nenhum status", () => {
    expect(workOrderStatusOptions).toHaveLength(5);
    expect(workOrderStatusOptions.map((option) => option.value)).toContain("WAITING_PARTS");
  });
});
