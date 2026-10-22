import { ArrowLeft, FileText, PlayCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/server/auth/session";
import { getInspection } from "@/server/services/inspections";
import { inspectionResultLabels, inspectionStatusLabels, inspectionStatusTone } from "@/lib/labels";
import { formatDate, formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { resolveAttachmentUrls, type ResolvedPhoto } from "@/server/storage/resolve";

export const metadata: Metadata = {
  title: "Detalhe da inspeção",
};

function toneClass(tone: string) {
  switch (tone) {
    case "success":
      return "bg-green-100 text-green-800";
    case "warning":
      return "bg-amber-100 text-amber-800";
    case "info":
      return "bg-blue-100 text-blue-800";
    case "danger":
      return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
}

export default async function InspectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  const { id } = await params;
  const inspection = await getInspection(user.companyId, id);

  if (!inspection) notFound();

  const isPending = inspection.status === "PENDING";
  const isCanceled = inspection.status === "CANCELED";

  // Resolve URLs assinadas para fotos de respostas e anexos gerais
  const responsePhotos: Record<string, ResolvedPhoto[]> = {};
  for (const r of inspection.responses) {
    if (r.attachments.length > 0) {
      responsePhotos[r.id] = await resolveAttachmentUrls(r.attachments);
    }
  }
  const generalPhotos = await resolveAttachmentUrls(inspection.attachments);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/app/inspecoes"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Voltar para inspeções
      </Link>

      <PageHeader
        title={inspection.template.name}
        description={inspection.template.description ?? undefined}
        action={
          <div className="flex items-center gap-2">
            {isPending && (
              <Link
                href={`/campo/inspecoes/${inspection.id}`}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <PlayCircle aria-hidden className="size-4" />
                Iniciar execução
              </Link>
            )}
            {!isCanceled && (
              <Link
                href={`/app/inspecoes/${inspection.id}/pdf`}
                className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                <FileText aria-hidden className="size-4" />
                PDF
              </Link>
            )}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Ativo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="font-medium">{inspection.asset.tag}</p>
            {inspection.asset.name && <p className="text-sm text-muted-foreground">{inspection.asset.name}</p>}
            <p className="text-sm text-muted-foreground">{inspection.asset.site.name}</p>
            {inspection.asset.site.city && (
              <p className="text-sm text-muted-foreground">
                {inspection.asset.site.city}, {inspection.asset.site.state}
              </p>
            )}
            <p className="text-sm text-muted-foreground">Cliente: {inspection.asset.site.client.name}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge tone={inspectionStatusTone[inspection.status]}>
              {inspectionStatusLabels[inspection.status]}
            </StatusBadge>
          </CardContent>
        </Card>

        {inspection.technician && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Técnico</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{inspection.technician.name}</p>
            </CardContent>
          </Card>
        )}

        {inspection.scheduledFor && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Agendada para</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{formatDate(inspection.scheduledFor)}</p>
            </CardContent>
          </Card>
        )}

        {inspection.startedAt && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Iniciada em</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{formatDateTime(inspection.startedAt)}</p>
            </CardContent>
          </Card>
        )}

        {inspection.completedAt && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Concluída em</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{formatDateTime(inspection.completedAt)}</p>
              {inspection.scorePercent !== null && inspection.scorePercent !== undefined && (
                <p className="mt-2 text-lg font-bold">
                  Score: {inspection.scorePercent}%
                </p>
              )}
              {inspection.failedItemCount > 0 && (
                <p className="mt-1 text-sm text-destructive">
                  {inspection.failedItemCount} item(ns) reprovado(s)
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {inspection.notes && (
          <Card className="sm:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{inspection.notes}</p>
            </CardContent>
          </Card>
        )}

        {inspection.generatedWorkOrders.length > 0 && (
          <Card className="sm:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">OS corretivas geradas</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {inspection.generatedWorkOrders.map((wo) => (
                  <li key={wo.id} className="flex items-center justify-between p-2 rounded-lg border">
                    <Link href={`/app/ordens/${wo.id}`} className="text-sm font-medium text-primary hover:underline">
                      OS #{wo.number} — {wo.title}
                    </Link>
                    <StatusBadge tone={inspectionStatusTone[wo.status as keyof typeof inspectionStatusTone]}>
                      {inspectionStatusLabels[wo.status as keyof typeof inspectionStatusLabels]}
                    </StatusBadge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {inspection.responses.length > 0 && (
          <Card className="sm:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Respostas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {inspection.responses.map((r) => {
                  const item = r.templateItem;
                  const resultLabel = r.result ? inspectionResultLabels[r.result] : "—";
                  const resultTone = r.result === "OK" ? "success" : r.result === "NOT_OK" ? "danger" : "neutral";
                  return (
                    <div key={r.id} className="p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{item.label}</p>
                          {item.helpText && <p className="text-xs text-muted-foreground mt-0.5">{item.helpText}</p>}
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 ${toneClass(resultTone)}`}>
                              {resultLabel}
                            </span>
                            {item.type === "NUMBER" && r.numberValue !== null && (
                              <span>{Number(r.numberValue)} {item.unit ?? ""}</span>
                            )}
                            {item.type === "TEXT" && r.textValue && (
                              <span className="truncate max-w-xs">{r.textValue}</span>
                            )}
                            {r.attachments.length > 0 && (
                              <span className="text-primary text-xs">📷 {r.attachments.length} foto(s)</span>
                            )}
                          </div>
                        </div>
                        {r.notes && (
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap max-w-md">
                            {r.notes}
                          </p>
                        )}
                      </div>
                      {(responsePhotos[r.id]?.length ?? 0) > 0 && (
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {(responsePhotos[r.id] ?? []).map((att) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={att.id}
                              src={att.url}
                              alt={att.fileName}
                              className="aspect-square w-full rounded-lg object-cover"
                              loading="lazy"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {generalPhotos.length > 0 && (
          <Card className="sm:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Anexos da inspeção</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {generalPhotos.map((att) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={att.id}
                    src={att.url}
                    alt={att.fileName}
                    className="aspect-square w-full rounded-lg object-cover"
                    loading="lazy"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}