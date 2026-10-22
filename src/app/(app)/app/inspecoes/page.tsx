import { ArrowLeft, Plus, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/native-select";
import { requireAdmin } from "@/server/auth/session";
import { listInspections } from "@/server/services/inspections";
import { inspectionStatusLabels } from "@/lib/labels";
import { formatDate, formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Inspeções",
};

export default async function InspectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const user = await requireAdmin();
  const params = await searchParams;
  const inspections = await listInspections(user.companyId, { status: params.status });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link
          href="/app"
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Voltar para painel
        </Link>
        <PageHeader
          title="Inspeções"
          description="Agende e acompanhe inspeções planejadas."
          action={
            <Link href="/app/inspecoes/nova" className="inline-flex items-center gap-2">
              <Plus aria-hidden className="size-4" />
              Nova inspeção
            </Link>
          }
        />
      </div>

      <Card>
        <CardContent className="p-4">
          <form className="flex flex-wrap items-end gap-4" method="GET">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="q" className="sr-only">Buscar</Label>
              <Input
                id="q"
                name="q"
                placeholder="Buscar por ativo, checklist, técnico…"
                defaultValue={params.q}
                className="max-w-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <NativeSelect name="status" defaultValue={params.status ?? ""} aria-label="Filtrar por status">
                <option value="">Todos os status</option>
                <option value="PENDING">Pendente</option>
                <option value="IN_PROGRESS">Em andamento</option>
                <option value="COMPLETED">Concluída</option>
                <option value="CANCELED">Cancelada</option>
              </NativeSelect>
            </div>
            <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <Search aria-hidden className="size-4" />
              Filtrar
            </button>
          </form>
        </CardContent>
      </Card>

      {inspections.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nenhuma inspeção encontrada.</p>
            <Link
              href="/app/inspecoes/nova"
              className="inline-flex items-center gap-2 mt-4 text-primary hover:underline"
            >
              <Plus aria-hidden className="size-4" />
              Criar a primeira inspeção
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {inspections.map((insp) => (
            <Card key={insp.id}>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-medium truncate">{insp.template.name}</h3>
                    <span className="text-sm text-muted-foreground">{insp.asset.tag}</span>
                    {insp.asset.name && <span className="text-sm text-muted-foreground">— {insp.asset.name}</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span>{insp.asset.site.name}</span>
                    {insp.technician && <span>Técnico: {insp.technician.name}</span>}
                    {insp.scheduledFor && <span>Agendada: {formatDate(insp.scheduledFor)}</span>}
                    <span>Criada: {formatDateTime(insp.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:ml-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      insp.status === "COMPLETED"
                        ? "bg-green-100 text-green-800"
                        : insp.status === "IN_PROGRESS"
                        ? "bg-blue-100 text-blue-800"
                        : insp.status === "PENDING"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {inspectionStatusLabels[insp.status as keyof typeof inspectionStatusLabels]}
                  </span>
                  <Link
                    href={`/app/inspecoes/${insp.id}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    Ver detalhes
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}