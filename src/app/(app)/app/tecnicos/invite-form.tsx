"use client";

import { Copy, Send } from "lucide-react";
import { useActionState, useState } from "react";

import { FieldError } from "@/components/field-error";
import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/native-select";
import { inviteUserAction } from "@/server/actions/users";
import { initialActionState } from "@/server/actions/state";

export function InviteForm() {
  const [state, formAction] = useActionState(inviteUserAction, initialActionState);
  const [copied, setCopied] = useState(false);
  const inviteLink = state.data?.inviteLink;

  async function copyLink() {
    if (!inviteLink) return;
    const fullUrl = `${window.location.origin}${inviteLink}`;
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
          <div className="flex flex-col gap-2">
            <Label htmlFor="invite-email">E-mail</Label>
            <Input
              id="invite-email"
              name="email"
              type="email"
              required
              placeholder="tecnico@empresa.com"
              aria-invalid={Boolean(state.fieldErrors?.email)}
            />
            <FieldError errors={state.fieldErrors?.email} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="invite-role">Papel</Label>
            <NativeSelect id="invite-role" name="role" required defaultValue="TECHNICIAN">
              <option value="TECHNICIAN">Técnico</option>
              <option value="ADMIN">Administrador</option>
            </NativeSelect>
            <FieldError errors={state.fieldErrors?.role} />
          </div>

          <div className="flex items-end">
            <Button type="submit" disabled={Boolean(state.success)}>
              <Send aria-hidden className="size-4" />
              Convidar
            </Button>
          </div>
        </div>
      </form>

      <FormMessage error={state.error} success={state.success} />

      {inviteLink && (
        <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3">
          <p className="text-sm font-medium">Link do convite:</p>
          <code className="break-all rounded bg-background p-2 text-xs">
            {typeof window !== "undefined" ? `${window.location.origin}${inviteLink}` : inviteLink}
          </code>
          <Button type="button" variant="outline" size="sm" onClick={copyLink} className="w-fit">
            <Copy aria-hidden className="size-4" />
            {copied ? "Copiado!" : "Copiar link"}
          </Button>
        </div>
      )}
    </div>
  );
}