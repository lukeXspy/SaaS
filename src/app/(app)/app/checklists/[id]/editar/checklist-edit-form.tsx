"use client";

import { useActionState } from "react";

import { FieldError } from "@/components/field-error";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/native-select";
import { Textarea } from "@/components/ui/textarea";
import { updateChecklistAction } from "@/server/actions/checklists";
import { initialActionState } from "@/server/actions/state";
import { assetCategories } from "@/lib/validation/checklists";

type ChecklistData = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
};

export function ChecklistEditForm({ checklist }: { checklist: ChecklistData }) {
  const [state, formAction] = useActionState(updateChecklistAction, initialActionState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={checklist.id} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nome *</Label>
        <Input
          id="name"
          name="name"
          required
          maxLength={120}
          defaultValue={checklist.name}
          placeholder="Ex.: Inspeção mensal de split"
          aria-invalid={Boolean(state.fieldErrors?.name)}
        />
        <FieldError errors={state.fieldErrors?.name} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="category">Categoria do ativo</Label>
        <NativeSelect id="category" name="category" defaultValue={checklist.category ?? ""}>
          <option value="">—</option>
          {assetCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </NativeSelect>
        <FieldError errors={state.fieldErrors?.category} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          maxLength={500}
          defaultValue={checklist.description ?? ""}
          placeholder="Orientações gerais, frequência recomendada, normas aplicáveis…"
        />
        <FieldError errors={state.fieldErrors?.description} />
      </div>

      <FormMessage error={state.error} success={state.success} />

      <SubmitButton className="w-full sm:w-auto">Salvar alterações</SubmitButton>
    </form>
  );
}