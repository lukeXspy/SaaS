"use client";

import { useActionState } from "react";

import { FieldError } from "@/components/field-error";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { addChecklistItemAction } from "@/server/actions/checklists";
import { initialActionState } from "@/server/actions/state";
import { checklistItemTypes } from "@/lib/validation/checklists";

export function ChecklistItemForm({ templateId }: { templateId: string }) {
  const [state, formAction] = useActionState(addChecklistItemAction, initialActionState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="templateId" value={templateId} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="label">Descrição do item *</Label>
        <Input
          id="label"
          name="label"
          required
          maxLength={160}
          placeholder="Ex.: Verificar pressão de gás"
          aria-invalid={Boolean(state.fieldErrors?.label)}
        />
        <FieldError errors={state.fieldErrors?.label} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="helpText">Texto de ajuda</Label>
        <Textarea
          id="helpText"
          name="helpText"
          rows={2}
          maxLength={300}
          placeholder="Instruções para o técnico, tolerâncias, referências…"
        />
        <FieldError errors={state.fieldErrors?.helpText} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="type">Tipo *</Label>
          <Select id="type" name="type" required defaultValue="TRI_STATE">
            {checklistItemTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <FieldError errors={state.fieldErrors?.type} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="unit">Unidade</Label>
          <Input
            id="unit"
            name="unit"
            maxLength={20}
            placeholder="Ex.: bar, °C, V"
          />
          <FieldError errors={state.fieldErrors?.unit} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="minValue">Valor mínimo</Label>
          <Input id="minValue" name="minValue" type="number" step="0.1" placeholder="Mínimo" />
          <FieldError errors={state.fieldErrors?.minValue} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="maxValue">Valor máximo</Label>
          <Input id="maxValue" name="maxValue" type="number" step="0.1" placeholder="Máximo" />
          <FieldError errors={state.fieldErrors?.maxValue} />
        </div>

        <div className="flex items-end">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="required" name="required" defaultChecked />
            <Label htmlFor="required" className="mb-0 cursor-pointer">Obrigatório</Label>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="requiresPhotoOnFail" name="requiresPhotoOnFail" />
        <Label htmlFor="requiresPhotoOnFail" className="mb-0 cursor-pointer">
          Exigir foto quando reprovado
        </Label>
      </div>

      <FormMessage error={state.error} success={state.success} />

      <SubmitButton className="w-full sm:w-auto">Adicionar item</SubmitButton>
    </form>
  );
}