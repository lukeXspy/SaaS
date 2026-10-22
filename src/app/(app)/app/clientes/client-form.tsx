"use client";

import { useActionState } from "react";

import { FieldError } from "@/components/field-error";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createClientAction,
  updateClientAction,
} from "@/server/actions/clients";
import { initialActionState } from "@/server/actions/state";

export type ClientFormData = {
  id: string;
  name: string;
  tradeName: string | null;
  document: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

export function ClientForm({ client }: { client?: ClientFormData }) {
  const action = client ? updateClientAction : createClientAction;
  const [state, formAction] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {client ? <input type="hidden" name="id" value={client.id} /> : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nome *</Label>
        <Input
          id="name"
          name="name"
          required
          maxLength={120}
          defaultValue={client?.name}
          placeholder="Ex.: Condomínio Jardim das Flores"
          aria-invalid={Boolean(state.fieldErrors?.name)}
        />
        <FieldError errors={state.fieldErrors?.name} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="tradeName">Nome fantasia</Label>
          <Input
            id="tradeName"
            name="tradeName"
            maxLength={120}
            defaultValue={client?.tradeName ?? ""}
          />
          <FieldError errors={state.fieldErrors?.tradeName} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="document">CNPJ / CPF</Label>
          <Input
            id="document"
            name="document"
            maxLength={20}
            inputMode="numeric"
            defaultValue={client?.document ?? ""}
            placeholder="00.000.000/0000-00"
          />
          <FieldError errors={state.fieldErrors?.document} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            maxLength={254}
            defaultValue={client?.email ?? ""}
          />
          <FieldError errors={state.fieldErrors?.email} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            maxLength={20}
            defaultValue={client?.phone ?? ""}
            placeholder="(11) 99999-0000"
          />
          <FieldError errors={state.fieldErrors?.phone} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={1000}
          defaultValue={client?.notes ?? ""}
          placeholder="Horário de atendimento, contato preferencial…"
        />
        <FieldError errors={state.fieldErrors?.notes} />
      </div>

      <FormMessage error={state.error} success={state.success} />

      <SubmitButton className="w-full sm:w-auto">
        {client ? "Salvar alterações" : "Cadastrar cliente"}
      </SubmitButton>
    </form>
  );
}
