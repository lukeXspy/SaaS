"use client";

import type { WorkOrderItemKind } from "@prisma/client";
import { Plus, Trash2 } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";

import { FieldError } from "@/components/field-error";
import { FormMessage } from "@/components/form-message";
import { NativeSelect } from "@/components/native-select";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatQuantity } from "@/lib/format";
import { workOrderItemKindLabels } from "@/lib/labels";
import {
  addWorkOrderItemAction,
  deleteWorkOrderItemAction,
} from "@/server/actions/work-orders";
import { initialActionState } from "@/server/actions/state";

export type ItemRow = {
  id: string;
  kind: WorkOrderItemKind;
  description: string;
  quantity: string;
  unit: string | null;
  notes: string | null;
};

export function ItemsManager({
  workOrderId,
  items,
}: {
  workOrderId: string;
  items: ItemRow[];
}) {
  const [state, formAction] = useActionState(addWorkOrderItemAction, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.reset();
  }, [items.length]);

  return (
    <div className="flex flex-col gap-4">
      <FormMessage error={state.error} success={state.success} />

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum serviço ou peça lançado.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium">{item.description}</p>
                <p className="text-xs text-muted-foreground">
                  {workOrderItemKindLabels[item.kind]} · Qtd. {formatQuantity(item.quantity)}
                  {item.unit ? ` ${item.unit}` : ""}
                </p>
                {item.notes ? (
                  <p className="mt-1 text-xs text-muted-foreground">{item.notes}</p>
                ) : null}
              </div>
              <form
                action={deleteWorkOrderItemAction}
                onSubmit={(event) => {
                  if (!window.confirm(`Remover "${item.description}"?`)) {
                    event.preventDefault();
                  }
                }}
              >
                <input type="hidden" name="workOrderId" value={workOrderId} />
                <input type="hidden" name="itemId" value={item.id} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remover ${item.description}`}
                >
                  <Trash2 aria-hidden />
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <details className="rounded-xl border p-3">
        <summary className="flex w-fit cursor-pointer list-none items-center gap-1 text-sm font-medium underline-offset-4 hover:underline">
          <Plus aria-hidden className="size-4" />
          Adicionar serviço ou peça
        </summary>

        <form ref={formRef} action={formAction} className="mt-4 flex flex-col gap-3">
          <input type="hidden" name="workOrderId" value={workOrderId} />

          <div className="grid grid-cols-[130px_1fr] gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="item-kind">Tipo *</Label>
              <NativeSelect id="item-kind" name="kind" required defaultValue="PART">
                {(Object.keys(workOrderItemKindLabels) as WorkOrderItemKind[]).map((kind) => (
                  <option key={kind} value={kind}>
                    {workOrderItemKindLabels[kind]}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="item-description">Descrição *</Label>
              <Input
                id="item-description"
                name="description"
                required
                maxLength={200}
                placeholder="Ex.: Capacitor 35 µF"
                aria-invalid={Boolean(state.fieldErrors?.description)}
              />
              <FieldError errors={state.fieldErrors?.description} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="item-quantity">Quantidade *</Label>
              <Input
                id="item-quantity"
                name="quantity"
                required
                inputMode="decimal"
                defaultValue="1"
                aria-invalid={Boolean(state.fieldErrors?.quantity)}
              />
              <FieldError errors={state.fieldErrors?.quantity} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="item-unit">Unidade</Label>
              <Input
                id="item-unit"
                name="unit"
                maxLength={20}
                placeholder="un, m, kg…"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="item-notes">Observação do item</Label>
            <Input id="item-notes" name="notes" maxLength={200} />
          </div>

          <SubmitButton size="sm" variant="secondary" pendingText="Adicionando…">
            Adicionar item
          </SubmitButton>
        </form>
      </details>
    </div>
  );
}
