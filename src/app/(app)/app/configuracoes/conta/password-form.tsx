"use client";

import { useActionState } from "react";

import { FieldError } from "@/components/field-error";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePasswordAction } from "@/server/actions/users";
import { initialActionState } from "@/server/actions/state";

export function PasswordForm() {
  const [state, formAction] = useActionState(changePasswordAction, initialActionState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="current-password">Senha atual *</Label>
        <Input
          id="current-password"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          aria-invalid={Boolean(state.fieldErrors?.currentPassword)}
        />
        <FieldError errors={state.fieldErrors?.currentPassword} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="new-password">Nova senha *</Label>
        <Input
          id="new-password"
          name="newPassword"
          type="password"
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          aria-invalid={Boolean(state.fieldErrors?.newPassword)}
        />
        <FieldError errors={state.fieldErrors?.newPassword} />
      </div>

      <FormMessage error={state.error} success={state.success} />

      <SubmitButton className="w-full sm:w-auto">Alterar senha</SubmitButton>
    </form>
  );
}