"use client";

import { Trash2 } from "lucide-react";
import { useActionState } from "react";

import { deleteChecklistItemAction } from "@/server/actions/checklists";
import { initialActionState } from "@/server/actions/state";

export function DeleteItemButton({ templateId, itemId }: { templateId: string; itemId: string }) {
  const [state, formAction] = useActionState(deleteChecklistItemAction, initialActionState);

  return (
    <form action={formAction}>
      <input type="hidden" name="templateId" value={templateId} />
      <input type="hidden" name="itemId" value={itemId} />
      <button
        type="submit"
        disabled={Boolean(state.error || state.success)}
        aria-label="Remover item"
        className="inline-flex items-center justify-center rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
      >
        <Trash2 aria-hidden className="size-4" />
      </button>
      {state.error && <p role="alert" className="text-sm text-destructive mt-1">{state.error}</p>}
    </form>
  );
}