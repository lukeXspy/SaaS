"use client";

import { useActionState } from "react";

import { FieldError } from "@/components/field-error";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createSiteAction,
  updateSiteAction,
} from "@/server/actions/clients";
import { initialActionState } from "@/server/actions/state";

export type SiteFormData = {
  id: string;
  clientId: string;
  name: string;
  addressLine: string;
  number: string | null;
  complement: string | null;
  district: string | null;
  city: string;
  state: string;
  postalCode: string | null;
  contactName: string | null;
  contactPhone: string | null;
  notes: string | null;
};

export function SiteForm({ clientId, site }: { clientId: string; site?: SiteFormData }) {
  const action = site ? updateSiteAction : createSiteAction;
  const [state, formAction] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="clientId" value={clientId} />
      {site ? <input type="hidden" name="id" value={site.id} /> : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="site-name">Nome do local *</Label>
        <Input
          id="site-name"
          name="name"
          required
          maxLength={120}
          defaultValue={site?.name}
          placeholder="Ex.: Torre A — Área comum"
          aria-invalid={Boolean(state.fieldErrors?.name)}
        />
        <FieldError errors={state.fieldErrors?.name} />
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
        <div className="flex flex-col gap-2">
          <Label htmlFor="addressLine">Endereço *</Label>
          <Input
            id="addressLine"
            name="addressLine"
            required
            maxLength={160}
            defaultValue={site?.addressLine}
            placeholder="Rua, avenida…"
            aria-invalid={Boolean(state.fieldErrors?.addressLine)}
          />
          <FieldError errors={state.fieldErrors?.addressLine} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="number">Número</Label>
          <Input id="number" name="number" maxLength={20} defaultValue={site?.number ?? ""} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="complement">Complemento</Label>
          <Input
            id="complement"
            name="complement"
            maxLength={60}
            defaultValue={site?.complement ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="district">Bairro</Label>
          <Input
            id="district"
            name="district"
            maxLength={60}
            defaultValue={site?.district ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="city">Cidade *</Label>
          <Input
            id="city"
            name="city"
            required
            maxLength={80}
            defaultValue={site?.city}
            aria-invalid={Boolean(state.fieldErrors?.city)}
          />
          <FieldError errors={state.fieldErrors?.city} />
        </div>
        <div className="grid grid-cols-[1fr_100px] gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="state">UF *</Label>
            <Input
              id="state"
              name="state"
              required
              maxLength={2}
              defaultValue={site?.state}
              placeholder="SP"
              className="uppercase"
              aria-invalid={Boolean(state.fieldErrors?.state)}
            />
            <FieldError errors={state.fieldErrors?.state} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="postalCode">CEP</Label>
            <Input
              id="postalCode"
              name="postalCode"
              maxLength={9}
              inputMode="numeric"
              defaultValue={site?.postalCode ?? ""}
              placeholder="00000-000"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="contactName">Contato no local</Label>
          <Input
            id="contactName"
            name="contactName"
            maxLength={120}
            defaultValue={site?.contactName ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="contactPhone">Telefone do contato</Label>
          <Input
            id="contactPhone"
            name="contactPhone"
            type="tel"
            maxLength={20}
            defaultValue={site?.contactPhone ?? ""}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="site-notes">Observações de acesso</Label>
        <Textarea
          id="site-notes"
          name="notes"
          rows={2}
          maxLength={500}
          defaultValue={site?.notes ?? ""}
          placeholder="Portaria, chave, horário de acesso…"
        />
      </div>

      <FormMessage error={state.error} success={state.success} />

      <SubmitButton className="w-full sm:w-auto">
        {site ? "Salvar local" : "Adicionar local"}
      </SubmitButton>
    </form>
  );
}
