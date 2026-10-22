import type { WorkOrderPriority, WorkOrderStatus, WorkOrderType } from "@prisma/client";
import { Plus, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { NativeSelect } from "@/components/native-select";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/format";
import {
  priorityTone,
  workOrderPriorityLabels,
  workOrderPriorityOptions,
  workOrderStatusLabels,
  workOrderStatusOptions,
  workOrderStatusTone,
  workOrderTypeLabels,
  workOrderTypeOptions,
} from "@/lib/labels";
import {
  workOrderPriorities,
  workOrderStatuses,
  workOrderTypes,
} from "@/lib/validation/work-orders";
import { requireAdmin } from "@/server/auth/session";
import { getWorkOrderOptions, listWorkOrders } from "@/server/services/work-orders";

export const metadata: Metadata = {
  title: "Ordens de serviço",
};

function pick<T extends string>(value: string | string[] | undefined, allowed: readonly T[]) {
  return typeof value === "string" && allowed.includes(value as T)
    ? (value as T)
    : undefined;
}

export default async function WorkOrdersPage({ searchParams }: PageProps<"/app/ordens">) {
  const user = await requireAdmin();
  const params = await searchParams;

  const query = typeof params.q === "string" ? params.q : "";
  const status = pick<WorkOrderStatus>(params.status, workOrderStatuses);
  const type = pick<WorkOrderType>(params.type, workOrderTypes);
  const priority = pick<WorkOrderPriority>(params.priority, workOrderPriorities);
  const assignedToId = typeof params.assignedToId === "string" ? params.assignedToId : undefined;

  const [workOrders, options] = await Promise.all([
    listWorkOrders(
      user.companyId,
      { query, status, type, priority, assignedToId },
      { userId: user.id, role: user.role },
    ),
    getWorkOrderOptions(user.companyId),
  ]);

  const hasFilters = Boolean(query || status || type || priority || assignedToId);
  const now = new Date();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ordens de serviço"
        description="Acompanhe as OS da equipe, prazos e execuções."
        action={
          <Link href="/app/ordens/nova" className={buttonVariants({ size: "sm" })}>
            <Plus aria-hidden />
            Nova OS
          </Link>
        }
      />

      <form method="get" className="flex flex-col gap-2">
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            name="q"
            defaultValue={query}
            placeholder="Nº, título, cliente ou TAG"
            className="pl-9"
            aria-label="Buscar ordens de serviço"
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
          <NativeSelect name="status" defaultValue={status ?? ""} aria-label="Status">
            <option value="">Todos os status</option>
            {workOrderStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect name="type" defaultValue={type ?? ""} aria-label="Tipo">
            <option value="">Todos os tipos</option>
            {workOrderTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect name="priority" defaultValue={priority ?? ""} aria-label="Prioridade">
            <option value="">Todas as prioridades</option>
            {workOrderPriorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect
            name="assignedToId"
            defaultValue={assignedToId ?? ""}
            aria-label="Responsável"
          >
            <option value="">Todos os responsáveis</option>
            {options.users.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </NativeSelect>
          <Button type="submit" variant="secondary">
            Filtrar
          </Button>
        </div>
      </form>

      {hasFilters ? (
        <Link
          href="/app/ordens"
          className="w-fit text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Limpar filtros
        </Link>
      ) : null}

      {workOrders.length === 0 ? (
        <EmptyState
          title={hasFilters ? "Nenhuma OS encontrada" : "Nenhuma ordem de serviço"}
          description={
            hasFilters
              ? "Ajuste os filtros ou crie uma nova ordem de serviço."
              : "Crie a primeira OS, atribua a um técnico e acompanhe a execução em campo."
          }
          action={
            <Link href="/app/ordens/nova" className={buttonVariants({ size: "sm" })}>
              Criar OS
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {workOrders.map((workOrder) => {
            const overdue =
              workOrder.dueAt !== null &&
              workOrder.dueAt < now &&
              workOrder.status !== "DONE" &&
              workOrder.status !== "CANCELED";

            return (
              <li key={workOrder.id}>
                <Card className="p-4">
                  <Link href={`/app/ordens/${workOrder.id}`} className="block">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-muted-foreground">
                          OS #{workOrder.number}
                        </p>
                        <p className="truncate font-medium">{workOrder.title}</p>
                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {workOrder.client.name} · {workOrder.site.name}
                          {workOrder.asset ? ` · ${workOrder.asset.tag}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge tone={workOrderStatusTone[workOrder.status]}>
                          {workOrderStatusLabels[workOrder.status]}
                        </StatusBadge>
                        <StatusBadge tone={priorityTone[workOrder.priority]}>
                          {workOrderPriorityLabels[workOrder.priority]}
                        </StatusBadge>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>{workOrderTypeLabels[workOrder.type]}</span>
                      <span>
                        {workOrder.assignedTo
                          ? `Responsável: ${workOrder.assignedTo.name}`
                          : "Sem responsável"}
                      </span>
                      <span className={overdue ? "font-medium text-red-600" : undefined}>
                        Prazo: {formatDate(workOrder.dueAt)}
                        {overdue ? " (atrasada)" : ""}
                      </span>
                    </div>
                  </Link>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
