"use client";

import { useActionState } from "react";

import { FieldError } from "@/components/field-error";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileAction } from "@/server/actions/users";
import { initialActionState } from "@/server/actions/state";

type UserData = {
  name: string;
  email: string;
  phone: string | null;
};

export function ProfileForm({ user }: { user: UserData }) {
  const [state, formAction] = useActionState(updateProfileAction, initialActionState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="profile-name">Nome *</Label>
        <Input
          id="profile-name"
          name="name"
          required
          maxLength={120}
          defaultValue={user.name}
          aria-invalid={Boolean(state.fieldErrors?.name)}
        />
        <FieldError errors={state.fieldErrors?.name} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="profile-email">E-mail *</Label>
        <Input
          id="profile-email"
          name="email"
          type="email"
          required
          maxLength={254}
          defaultValue={user.email}
          aria-invalid={Boolean(state.fieldErrors?.email)}
        />
        <FieldError errors={state.fieldErrors?.email} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="profile-phone">Telefone</Label>
        <Input
          id="profile-phone"
          name="phone"
          type="tel"
          maxLength={20}
          defaultValue={user.phone ?? ""}
          placeholder="(11) 99999-0000"
        />
        <FieldError errors={state.fieldErrors?.phone} />
      </div>

      <FormMessage error={state.error} success={state.success} />

      <SubmitButton className="w-full sm:w-auto">Salvar dados</SubmitButton>
    </form>
  );
}