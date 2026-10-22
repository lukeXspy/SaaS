"use client";

import { useActionState } from "react";

import { FieldError } from "@/components/field-error";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { acceptInviteAction } from "@/server/actions/users";
import { initialActionState } from "@/server/actions/state";

export function AcceptInviteForm({ token, email }: { token: string; email: string }) {
  const [state, formAction] = useActionState(acceptInviteAction, initialActionState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="email" value={email} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Seu nome completo *</Label>
        <Input
          id="name"
          name="name"
          required
          maxLength={120}
          placeholder="Ex.: João Silva"
          aria-invalid={Boolean(state.fieldErrors?.name)}
        />
        <FieldError errors={state.fieldErrors?.name} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Senha *</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          maxLength={72}
          placeholder="Mínimo 8 caracteres"
          aria-invalid={Boolean(state.fieldErrors?.password)}
        />
        <FieldError errors={state.fieldErrors?.password} />
      </div>

      <FormMessage error={state.error} success={state.success} />

      <SubmitButton className="w-full">Criar conta e entrar</SubmitButton>
    </form>
  );
}