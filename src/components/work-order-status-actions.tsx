"use client";

import type { UserRole, WorkOrderStatus } from "@prisma/client";
import { Check, Pause, Play, RotateCcw, Undo2, XCircle } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { canTransition } from "@/lib/work-order-state";
import { transitionWorkOrderAction } from "@/server/actions/work-orders";
import { initialActionState } from "@/server/actions/state";

type Candidate = {
  to: WorkOrderStatus;
  label: string;
  icon: typeof Play;
};

export function WorkOrderStatusActions({
  workOrderId,
  status,
  role,
}: {
  workOrderId: string;
  status: WorkOrderStatus;
  role: UserRole;
}) {
  const [state, formAction] = useActionState(transitionWorkOrderAction, initialActionState);
  const [cancelState, cancelAction] = useActionState(
    transitionWorkOrderAction,
    initialActionState,
  );

  const candidates: Candidate[] = [
    {
      to: "IN_PROGRESS",
      label: status === "WAITING_PARTS" ? "Retomar serviço" : "Iniciar OS",
      icon: status === "WAITING_PARTS" ? RotateCcw : Play,
    },
    { to: "WAITING_PARTS", label: "Aguardar peças", icon: Pause },
    { to: "OPEN", label: "Reabrir OS", icon: Undo2 },
  ];

  const allowed = candidates.filter((candidate) =>
    canTransition(status, candidate.to, { role }),
  );
  const canCancel = canTransition(status, "CANCELED", { role });

  return (
    <div className="flex flex-col gap-3">
      <FormMessage error={state.error} success={state.success} />

      <div className="flex flex-wrap gap-2">
        {status === "IN_PROGRESS" ? (
          <Link
            href={`/campo/os/${workOrderId}/concluir`}
            className={buttonVariants({ size: "sm" })}
          >
            <Check aria-hidden />
            Concluir OS
          </Link>
        ) : null}

        {allowed.length > 0 ? (
          <form action={formAction} className="flex flex-wrap gap-2">
            <input type="hidden" name="id" value={workOrderId} />
            {allowed.map((candidate) => (
              <Button
                key={candidate.to}
                type="submit"
                name="to"
                value={candidate.to}
                variant="outline"
                size="sm"
              >
                <candidate.icon aria-hidden />
                {candidate.label}
              </Button>
            ))}
          </form>
        ) : null}
      </div>

      {canCancel ? (
        <details className="rounded-xl border p-3">
          <summary className="flex w-fit cursor-pointer list-none items-center gap-1 text-sm font-medium text-destructive underline-offset-4 hover:underline">
            <XCircle aria-hidden className="size-4" />
            Cancelar OS
          </summary>
          <form action={cancelAction} className="mt-3 flex flex-col gap-3">
            <input type="hidden" name="id" value={workOrderId} />
            <input type="hidden" name="to" value="CANCELED" />
            <label htmlFor={`cancel-${workOrderId}`} className="text-sm font-medium">
              Motivo do cancelamento *
            </label>
            <Textarea
              id={`cancel-${workOrderId}`}
              name="cancelReason"
              rows={2}
              required
              maxLength={500}
              placeholder="Ex.: cliente cancelou o atendimento"
            />
            <FormMessage error={cancelState.error} success={cancelState.success} />
            <SubmitButton variant="destructive" size="sm" pendingText="Cancelando…">
              Confirmar cancelamento
            </SubmitButton>
          </form>
        </details>
      ) : null}
    </div>
  );
}
