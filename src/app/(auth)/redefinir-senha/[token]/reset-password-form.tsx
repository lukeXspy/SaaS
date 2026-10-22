"use client";

import { useActionState } from "react";
import Link from "next/link";

import { FieldError } from "@/components/field-error";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordAction } from "@/server/actions/users";
import { initialActionState } from "@/server/actions/state";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(resetPasswordAction, initialActionState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Nova senha *</Label>
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

      <SubmitButton className="w-full">
        {state.success ? "Senha redefinida!" : "Redefinir senha"}
      </SubmitButton>

      {state.success && (
        <Link href="/login" className="text-center text-sm font-medium text-primary hover:underline">
          Ir para o login
        </Link>
      )}
    </form>
  );
}