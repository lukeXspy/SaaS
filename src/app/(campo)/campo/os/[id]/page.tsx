import { ArrowLeft, CheckCircle2, ClipboardList, MapPin, XCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatDate,
  formatDateTime,
  formatMinutes,
  formatQuantity,
} from "@/lib/format";
import {
  priorityTone,
  workOrderItemKindLabels,
  workOrderPriorityLabels,
  workOrderStatusLabels,
  workOrderStatusTone,
  workOrderTypeLabels,
} from "@/lib/labels";
import { WorkOrderStatusActions } from "@/components/work-order-status-actions";
import { requireUser } from "@/server/auth/session";
import { getWorkOrder } from "@/server/services/work-orders";
import { ExecutionForm } from "./execution-form";
import { ItemsManager } from "./items-manager";

export const metadata: Metadata = {
  title: "Executar OS",
};

export default async function FieldWorkOrderPage({ params }: PageProps<"/campo/os/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const workOrder = await getWorkOrder(user.companyId, id, {
    userId: user.id,
    role: user.role,
  });

  if (!workOrder) notFound();

  const now = new Date();
  const terminal = workOrder.status === "DONE" || workOrder.status === "CANCELED";
  const canExecute = workOrder.status === "IN_PROGRESS" || workOrder.status === "WAITING_PARTS";
  const overdue =
    workOrder.dueAt !== null &&
    workOrder.dueAt < now &&
    workOrder.status !== "DONE" &&
    workOrder.status !== "CANCELED";

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/campo"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Voltar para meu dia
      </Link>

      <PageHeader
        title={workOrder.title}
        description={`OS #${workOrder.number} · ${workOrderTypeLabels[workOrder.type]}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={workOrderStatusTone[workOrder.status]}>
              {workOrderStatusLabels[workOrder.status]}
            </StatusBadge>
            <StatusBadge tone={priorityTone[workOrder.priority]}>
              {workOrderPriorityLabels[workOrder.priority]}
            </StatusBadge>
          </div>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-2 text-sm">
          <p className="flex items-start gap-1.5">
            <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span>
              <span className="font-medium">{workOrder.client.name}</span>
              {" · "}
              {workOrder.site.name}
              {workOrder.asset ? (
                <>
                  <br />
                  {workOrder.asset.tag} — {workOrder.asset.name}
                </>
              ) : null}
            </span>
          </p>
          <p className={overdue ? "font-medium text-red-600" : "text-muted-foreground"}>
            Prazo: {formatDate(workOrder.dueAt)}
            {overdue ? " (atrasada)" : ""}
          </p>
          {workOrder.description ? (
            <p className="mt-2 rounded-lg bg-muted px-3 py-2 whitespace-pre-line">
              {workOrder.description}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {workOrder.status === "CANCELED" ? (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
          <CardContent className="flex items-start gap-2 text-sm text-red-900 dark:text-red-200">
            <XCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
            <p>
              <strong>OS cancelada.</strong>
              {workOrder.cancelReason ? ` Motivo: ${workOrder.cancelReason}` : ""}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Andamento</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkOrderStatusActions
            workOrderId={workOrder.id}
            status={workOrder.status}
            role={user.role}
          />
        </CardContent>
      </Card>

      {workOrder.status === "OPEN" ? (
        <p className="text-sm text-muted-foreground">
          Inicie a OS para registrar diagnóstico, solução, tempo e itens.
        </p>
      ) : null}

      {canExecute ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Execução</CardTitle>
            </CardHeader>
            <CardContent>
              <ExecutionForm workOrderId={workOrder.id} execution={workOrder.execution} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Serviços e peças</CardTitle>
            </CardHeader>
            <CardContent>
              <ItemsManager
                workOrderId={workOrder.id}
                items={workOrder.items.map((item) => ({
                  id: item.id,
                  kind: item.kind,
                  description: item.description,
                  quantity: item.quantity.toString(),
                  unit: item.unit,
                  notes: item.notes,
                }))}
              />
            </CardContent>
          </Card>
        </>
      ) : null}

      {terminal ? (
        <>
          {workOrder.execution ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 aria-hidden className="size-4 text-emerald-600" />
                  Execução registrada
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Tempo apontado</p>
                  <p className="font-medium">{formatMinutes(workOrder.execution.laborMinutes)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Diagnóstico</p>
                  <p className="whitespace-pre-line">{workOrder.execution.diagnosis || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Solução</p>
                  <p className="whitespace-pre-line">{workOrder.execution.solution || "—"}</p>
                </div>
                {workOrder.execution.observations ? (
                  <div>
                    <p className="text-muted-foreground">Observações</p>
                    <p className="whitespace-pre-line">{workOrder.execution.observations}</p>
                  </div>
                ) : null}
                {workOrder.execution.signedByName ? (
                  <div>
                    <p className="text-muted-foreground">Assinatura</p>
                    <p className="font-medium">{workOrder.execution.signedByName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(workOrder.execution.signedAt)}
                    </p>
                    {workOrder.execution.signatureUrl?.startsWith("data:image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={workOrder.execution.signatureUrl}
                        alt={`Assinatura de ${workOrder.execution.signedByName}`}
                        className="mt-2 h-20 rounded border bg-white object-contain"
                      />
                    ) : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList aria-hidden className="size-4 text-muted-foreground" />
                Serviços e peças
              </CardTitle>
            </CardHeader>
            <CardContent>
              {workOrder.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum item lançado.</p>
              ) : (
                <ul className="flex flex-col gap-2 text-sm">
                  {workOrder.items.map((item) => (
                    <li key={item.id} className="flex justify-between gap-3 border-b pb-2 last:border-0">
                      <div>
                        <p className="font-medium">{item.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {workOrderItemKindLabels[item.kind]}
                          {item.unit ? ` · ${item.unit}` : ""}
                        </p>
                      </div>
                      <span className="tabular-nums">{formatQuantity(item.quantity)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}

      {user.role === "ADMIN" ? (
        <Link
          href={`/app/ordens/${workOrder.id}`}
          className={buttonVariants({ variant: "outline", size: "sm", className: "w-fit" })}
        >
          Abrir visão de gestão
        </Link>
      ) : null}
    </div>
  );
}
