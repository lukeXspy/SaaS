"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { deletePhotoAction } from "@/server/actions/photos";
import { initialActionState } from "@/server/actions/state";

export function DeletePhotoButton({ attachmentId }: { attachmentId: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    deletePhotoAction,
    initialActionState,
  );

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={attachmentId} />
      <button
        type="submit"
        disabled={pending}
        aria-label="Remover foto"
        title="Remover foto"
        className="absolute top-1 right-1 inline-flex size-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80 disabled:opacity-50"
      >
        <Trash2 aria-hidden className="size-4" />
      </button>
      {state.error ? (
        <p role="alert" className="absolute inset-x-1 bottom-1 rounded bg-white/90 px-1 text-[10px] text-destructive">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
