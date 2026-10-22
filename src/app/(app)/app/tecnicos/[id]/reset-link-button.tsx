"use client";

import { Copy, KeyRound } from "lucide-react";
import { useActionState, useState } from "react";

import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { generateResetLinkAction } from "@/server/actions/users";
import { initialActionState } from "@/server/actions/state";

export function ResetLinkButton({ userId, userName }: { userId: string; userName: string }) {
  const [state, formAction] = useActionState(generateResetLinkAction, initialActionState);
  const [copied, setCopied] = useState(false);
  const resetLink = state.data?.resetLink;

  async function copyLink() {
    if (!resetLink) return;
    const fullUrl = `${window.location.origin}${resetLink}`;
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-3">
      <form action={formAction}>
        <input type="hidden" name="userId" value={userId} />
        <Button type="submit" variant="outline" size="sm">
          <KeyRound aria-hidden className="size-4" />
          Gerar link de redefinição
        </Button>
      </form>

      <FormMessage error={state.error} success={state.success} />

      {resetLink && (
        <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3">
          <p className="text-sm font-medium">
            Link para {userName} redefinir a senha:
          </p>
          <code className="break-all rounded bg-background p-2 text-xs">
            {typeof window !== "undefined" ? `${window.location.origin}${resetLink}` : resetLink}
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