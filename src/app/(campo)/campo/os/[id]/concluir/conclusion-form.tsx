"use client";

import { useActionState, useState } from "react";

import { FieldError } from "@/components/field-error";
import { FormMessage } from "@/components/form-message";
import { SignaturePad } from "@/components/signature-pad";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { completeWorkOrderAction } from "@/server/actions/work-orders";
import { initialActionState } from "@/server/actions/state";

export function ConclusionForm({ workOrderId }: { workOrderId: string }) {
  const [state, formAction] = useActionState(completeWorkOrderAction, initialActionState);
  const [signature, setSignature] = useState("");

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="workOrderId" value={workOrderId} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="signedByName">Quem assinou *</Label>
        <Input
          id="signedByName"
          name="signedByName"
          required
          maxLength={120}
          placeholder="Nome de quem recebeu o serviço"
          aria-invalid={Boolean(state.fieldErrors?.signedByName)}
        />
        <FieldError errors={state.fieldErrors?.signedByName} />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Assinatura *</Label>
        <input type="hidden" name="signatureDataUrl" value={signature} />
        <SignaturePad
          onChange={setSignature}
          error={state.fieldErrors?.signatureDataUrl}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="finalObservations">Observações finais</Label>
        <Textarea
          id="finalObservations"
          name="observations"
          rows={2}
          maxLength={2000}
          placeholder="Orientações ao cliente (opcional)"
        />
      </div>

      <FormMessage error={state.error} success={state.success} />

      <SubmitButton
        size="lg"
        className="w-full"
        pendingText="Concluindo…"
        disabled={!signature}
      >
        Concluir OS e assinar
      </SubmitButton>
    </form>
  );
}
