"use client";

import { useActionState } from "react";

import { FieldError } from "@/components/field-error";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/native-select";
import { Textarea } from "@/components/ui/textarea";
import { createInspectionAction } from "@/server/actions/inspections";
import { initialActionState } from "@/server/actions/state";

type AssetOption = { id: string; tag: string; name: string; site: { name: string } };
type TemplateOption = { id: string; name: string; category: string | null };
type TechnicianOption = { id: string; name: string };

export function InspectionForm({
  assets,
  templates,
  technicians,
}: {
  assets: AssetOption[];
  templates: TemplateOption[];
  technicians: TechnicianOption[];
}) {
  const [state, formAction] = useActionState(createInspectionAction, initialActionState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="assetId">Ativo *</Label>
        <NativeSelect id="assetId" name="assetId" required aria-invalid={Boolean(state.fieldErrors?.assetId)}>
          <option value="">Selecione o ativo</option>
          {assets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.tag} — {a.name} ({a.site.name})
            </option>
          ))}
        </NativeSelect>
        <FieldError errors={state.fieldErrors?.assetId} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="templateId">Checklist *</Label>
        <NativeSelect id="templateId" name="templateId" required aria-invalid={Boolean(state.fieldErrors?.templateId)}>
          <option value="">Selecione o checklist</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} {t.category ? `(${t.category})` : ""}
            </option>
          ))}
        </NativeSelect>
        <FieldError errors={state.fieldErrors?.templateId} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="technicianId">Técnico responsável</Label>
        <NativeSelect id="technicianId" name="technicianId" defaultValue="">
          <option value="">— (atribuir depois)</option>
          {technicians.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </NativeSelect>
        <FieldError errors={state.fieldErrors?.technicianId} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="scheduledFor">Data agendada</Label>
        <Input
          id="scheduledFor"
          name="scheduledFor"
          type="date"
          inputMode="numeric"
        />
        <FieldError errors={state.fieldErrors?.scheduledFor} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={1000}
          placeholder="Instruções especiais, pontos de atenção, normas aplicáveis…"
        />
        <FieldError errors={state.fieldErrors?.notes} />
      </div>

      <FormMessage error={state.error} success={state.success} />

      <SubmitButton className="w-full sm:w-auto">Agendar inspeção</SubmitButton>
    </form>
  );
}