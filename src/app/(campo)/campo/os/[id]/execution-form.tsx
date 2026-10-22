"use client";

import { useActionState } from "react";

import { FieldError } from "@/components/field-error";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveExecutionAction } from "@/server/actions/work-orders";
import { initialActionState } from "@/server/actions/state";

export type ExecutionData = {
  diagnosis: string | null;
  solution: string | null;
  observations: string | null;
  laborMinutes: number | null;
};

export function ExecutionForm({
  workOrderId,
  execution,
}: {
  workOrderId: string;
  execution: ExecutionData | null;
}) {
  const [state, formAction] = useActionState(saveExecutionAction, initialActionState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="workOrderId" value={workOrderId} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="diagnosis">Diagnóstico</Label>
        <Textarea
          id="diagnosis"
          name="diagnosis"
          rows={3}
          maxLength={2000}
          defaultValue={execution?.diagnosis ?? ""}
          placeholder="O que foi encontrado no equipamento"
        />
        <FieldError errors={state.fieldErrors?.diagnosis} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="solution">Solução aplicada</Label>
        <Textarea
          id="solution"
          name="solution"
          rows={3}
          maxLength={2000}
          defaultValue={execution?.solution ?? ""}
          placeholder="O que foi feito para resolver"
        />
        <FieldError errors={state.fieldErrors?.solution} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="laborMinutes">Tempo apontado (minutos)</Label>
        <Input
          id="laborMinutes"
          name="laborMinutes"
          type="number"
          inputMode="numeric"
          min={0}
          max={100000}
          step={1}
          defaultValue={execution?.laborMinutes ?? ""}
          placeholder="Ex.: 90"
          aria-invalid={Boolean(state.fieldErrors?.laborMinutes)}
        />
        <FieldError errors={state.fieldErrors?.laborMinutes} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="observations">Observações</Label>
        <Textarea
          id="observations"
          name="observations"
          rows={2}
          maxLength={2000}
          defaultValue={execution?.observations ?? ""}
          placeholder="Orientações ao cliente, pendências…"
        />
      </div>

      <FormMessage error={state.error} success={state.success} />

      <SubmitButton size="lg" className="w-full" pendingText="Salvando…">
        Salvar execução
      </SubmitButton>
    </form>
  );
}
