import { ArrowLeft, FileText, MapPin, Pencil, PlayCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { PhotoGallery } from "@/components/photo-gallery";
import { PhotoUploader } from "@/components/photo-uploader";
import { StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatDateTime, formatMinutes, formatQuantity } from "@/lib/format";
import {
  priorityTone,
  workOrderItemKindLabels,
  workOrderPriorityLabels,
  workOrderStatusLabels,
  workOrderStatusTone,
  workOrderTypeLabels,
} from "@/lib/labels";
import { WorkOrderStatusActions } from "@/components/work-order-status-actions";
import { requireAdmin } from "@/server/auth/session";
import { getWorkOrder } from "@/server/services/work-orders";
import {
  resolveAttachmentUrls,
  resolveExecutionSignatureUrl,
} from "@/server/storage/resolve";

export const metadata: Metadata = {
  title: "Detalhe da OS",
};

export default async function WorkOrderDetailPage({ params }: PageProps<"/app/ordens/[id]">) {
  const user = await requireAdmin();
  const { id } = await params;
  const workOrder = await getWorkOrder(user.companyId, id, {
    userId: user.id,
    role: user.role,
  });

  if (!workOrder) notFound();

  const [photoUrls, signatureUrl] = await Promise.all([
    resolveAttachmentUrls(workOrder.attachments),
    resolveExecutionSignatureUrl(workOrder.execution?.signatureUrl ?? null),
  ]);
  const now = new Date();
  const terminal = workOrder.status === "DONE" || workOrder.status === "CANCELED";
  const overdue =
    workOrder.dueAt !== null &&
    workOrder.dueAt < now &&
    workOrder.status !== "DONE" &&
    workOrder.status !== "CANCELED";

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/app/ordens"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Voltar para ordens
      </Link>

      <PageHeader
        title={workOrder.title}
        description={`OS #${workOrder.number} · ${workOrder.client.name} · ${workOrder.site.name}`}
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

      <div className="flex flex-wrap gap-2">
        <a
          href={`/api/ordens/${workOrder.id}/pdf`}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <FileText aria-hidden />
          Abrir PDF
        </a>
        {!terminal ? (
          <>
            <Link
              href={`/app/ordens/${workOrder.id}/editar`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Pencil aria-hidden />
              Editar OS
            </Link>
            <Link
              href={`/campo/os/${workOrder.id}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <PlayCircle aria-hidden />
              Abrir execução
            </Link>
          </>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Dados da OS</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Tipo</dt>
                <dd className="font-medium">{workOrderTypeLabels[workOrder.type]}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Responsável</dt>
                <dd className="font-medium">
                  {workOrder.assignedTo?.name ?? "Não atribuído"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Prazo</dt>
                <dd className={overdue ? "font-medium text-red-600" : "font-medium"}>
                  {formatDate(workOrder.dueAt)}
                  {overdue ? " (atrasada)" : ""}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Agendada para</dt>
                <dd className="font-medium">{formatDate(workOrder.scheduledAt)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Criada por</dt>
                <dd className="font-medium">{workOrder.createdBy.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Criada em</dt>
                <dd className="font-medium">{formatDateTime(workOrder.createdAt)}</dd>
              </div>
              {workOrder.completedAt ? (
                <div>
                  <dt className="text-muted-foreground">Concluída em</dt>
                  <dd className="font-medium">{formatDateTime(workOrder.completedAt)}</dd>
                </div>
              ) : null}
              {workOrder.canceledAt ? (
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Cancelada em</dt>
                  <dd className="font-medium">
                    {formatDateTime(workOrder.canceledAt)}
                    {workOrder.cancelReason ? ` — ${workOrder.cancelReason}` : ""}
                  </dd>
                </div>
              ) : null}
            </dl>

            {workOrder.description ? (
              <p className="rounded-lg bg-muted px-3 py-2 text-sm whitespace-pre-line">
                {workOrder.description}
              </p>
            ) : null}

            <div className="rounded-lg border p-3 text-sm">
              <p className="flex items-start gap-1.5">
                <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span>
                  <Link
                    href={`/app/clientes/${workOrder.client.id}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {workOrder.client.name}
                  </Link>
                  {" · "}
                  <Link
                    href={`/app/locais/${workOrder.site.id}/editar`}
                    className="underline-offset-4 hover:underline"
                  >
                    {workOrder.site.name}
                  </Link>
                  {workOrder.asset ? (
                    <>
                      {" · "}
                      <Link
                        href={`/app/ativos/${workOrder.asset.id}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {workOrder.asset.tag} — {workOrder.asset.name}
                      </Link>
                    </>
                  ) : null}
                </span>
              </p>
            </div>

            <div className="border-t pt-4">
              <WorkOrderStatusActions
                workOrderId={workOrder.id}
                status={workOrder.status}
                role={user.role}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Execução</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              {workOrder.execution ? (
                <>
                  <div>
                    <p className="text-muted-foreground">Tempo apontado</p>
                    <p className="font-medium">
                      {formatMinutes(workOrder.execution.laborMinutes)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Diagnóstico</p>
                    <p className="whitespace-pre-line">
                      {workOrder.execution.diagnosis || "—"}
                    </p>
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
                      {signatureUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={signatureUrl}
                          alt={`Assinatura de ${workOrder.execution.signedByName}`}
                          className="mt-2 h-20 rounded border bg-white object-contain"
                        />
                      ) : null}
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="text-muted-foreground">A execução ainda não foi iniciada.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Itens</CardTitle>
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
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fotos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!terminal ? <PhotoUploader target={{ workOrderId: workOrder.id }} /> : null}
          <PhotoGallery
            photos={photoUrls}
            canDelete={!terminal}
            emptyText="Nenhuma foto anexada à OS."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-col gap-3">
            {workOrder.statusHistory.map((entry) => (
              <li key={entry.id} className="border-l-2 pl-3 text-sm">
                <p className="font-medium">
                  {entry.fromStatus
                    ? `${workOrderStatusLabels[entry.fromStatus]} → ${workOrderStatusLabels[entry.toStatus]}`
                    : workOrderStatusLabels[entry.toStatus]}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(entry.createdAt)}
                  {entry.changedBy ? ` · ${entry.changedBy.name}` : ""}
                </p>
                {entry.note ? <p className="mt-1">{entry.note}</p> : null}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
