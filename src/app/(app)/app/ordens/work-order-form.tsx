"use client";

import type {
  UserRole,
  WorkOrderPriority,
  WorkOrderType,
} from "@prisma/client";
import { useActionState, useMemo, useState } from "react";

import { FieldError } from "@/components/field-error";
import { FormMessage } from "@/components/form-message";
import { NativeSelect } from "@/components/native-select";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  roleLabels,
  workOrderPriorityOptions,
  workOrderTypeOptions,
} from "@/lib/labels";
import { createWorkOrderAction, updateWorkOrderAction } from "@/server/actions/work-orders";
import { initialActionState } from "@/server/actions/state";

export type WorkOrderFormData = {
  id: string;
  siteId: string;
  assetId: string | null;
  type: WorkOrderType;
  priority: WorkOrderPriority;
  title: string;
  description: string | null;
  assignedToId: string | null;
  dueAt: string;
  scheduledAt: string;
};

export type WorkOrderFormOptions = {
  clients: {
    id: string;
    name: string;
    sites: { id: string; name: string; assets: { id: string; tag: string; name: string }[] }[];
  }[];
  users: { id: string; name: string; role: UserRole }[];
};

export function WorkOrderForm({
  options,
  workOrder,
}: {
  options: WorkOrderFormOptions;
  workOrder?: WorkOrderFormData;
}) {
  const action = workOrder ? updateWorkOrderAction : createWorkOrderAction;
  const [state, formAction] = useActionState(action, initialActionState);

  const [siteId, setSiteId] = useState(workOrder?.siteId ?? "");
  const [assetId, setAssetId] = useState(workOrder?.assetId ?? "");

  const assets = useMemo(() => {
    for (const client of options.clients) {
      const site = client.sites.find((item) => item.id === siteId);
      if (site) return site.assets;
    }
    return [];
  }, [options.clients, siteId]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {workOrder ? <input type="hidden" name="id" value={workOrder.id} /> : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Título da OS *</Label>
        <Input
          id="title"
          name="title"
          required
          maxLength={120}
          defaultValue={workOrder?.title}
          placeholder="Ex.: Split não gela — Sala 2"
          aria-invalid={Boolean(state.fieldErrors?.title)}
        />
        <FieldError errors={state.fieldErrors?.title} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="type">Tipo *</Label>
          <NativeSelect
            id="type"
            name="type"
            required
            defaultValue={workOrder?.type ?? "CORRECTIVE"}
            aria-invalid={Boolean(state.fieldErrors?.type)}
          >
            {workOrderTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
          <FieldError errors={state.fieldErrors?.type} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="priority">Prioridade *</Label>
          <NativeSelect
            id="priority"
            name="priority"
            required
            defaultValue={workOrder?.priority ?? "MEDIUM"}
            aria-invalid={Boolean(state.fieldErrors?.priority)}
          >
            {workOrderPriorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
          <FieldError errors={state.fieldErrors?.priority} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="siteId">Local *</Label>
        <NativeSelect
          id="siteId"
          name="siteId"
          required
          value={siteId}
          onChange={(event) => {
            setSiteId(event.target.value);
            setAssetId("");
          }}
          aria-invalid={Boolean(state.fieldErrors?.siteId)}
        >
          <option value="" disabled>
            Selecione o cliente e o local
          </option>
          {options.clients.map((client) => (
            <optgroup key={client.id} label={client.name}>
              {client.sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </optgroup>
          ))}
        </NativeSelect>
        <FieldError errors={state.fieldErrors?.siteId} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="assetId">Ativo</Label>
          <NativeSelect
            id="assetId"
            name="assetId"
            value={assetId}
            onChange={(event) => setAssetId(event.target.value)}
            disabled={!siteId || assets.length === 0}
          >
            <option value="">Sem ativo vinculado</option>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.tag} — {asset.name}
              </option>
            ))}
          </NativeSelect>
          <p className="text-xs text-muted-foreground">
            {siteId && assets.length === 0
              ? "Este local não possui ativos ativos cadastrados."
              : "Vincule um equipamento para manter o histórico."}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="assignedToId">Responsável</Label>
          <NativeSelect
            id="assignedToId"
            name="assignedToId"
            defaultValue={workOrder?.assignedToId ?? ""}
          >
            <option value="">Não atribuir agora</option>
            {options.users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({roleLabels[user.role]})
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="dueAt">Prazo</Label>
          <Input
            id="dueAt"
            name="dueAt"
            type="date"
            defaultValue={workOrder?.dueAt ?? ""}
            aria-invalid={Boolean(state.fieldErrors?.dueAt)}
          />
          <FieldError errors={state.fieldErrors?.dueAt} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="scheduledAt">Data agendada</Label>
          <Input
            id="scheduledAt"
            name="scheduledAt"
            type="date"
            defaultValue={workOrder?.scheduledAt ?? ""}
            aria-invalid={Boolean(state.fieldErrors?.scheduledAt)}
          />
          <FieldError errors={state.fieldErrors?.scheduledAt} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          maxLength={2000}
          defaultValue={workOrder?.description ?? ""}
          placeholder="O que foi solicitado, sintomas, combinados com o cliente…"
        />
      </div>

      <FormMessage error={state.error} success={state.success} />

      <SubmitButton className="w-full sm:w-auto">
        {workOrder ? "Salvar OS" : "Criar OS"}
      </SubmitButton>
    </form>
  );
}
