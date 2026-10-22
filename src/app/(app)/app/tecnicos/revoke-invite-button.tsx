"use client";

import { X } from "lucide-react";

import { revokeInviteAction } from "@/server/actions/users";

export function RevokeInviteButton({ inviteId }: { inviteId: string }) {
  return (
    <form action={revokeInviteAction}>
      <input type="hidden" name="id" value={inviteId} />
      <button
        type="submit"
        aria-label="Cancelar convite"
        title="Cancelar convite"
        className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
      >
        <X aria-hidden className="size-4" />
      </button>
    </form>
  );
}