import { ArrowLeft, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/native-select";
import { requireUser } from "@/server/auth/session";
import { listInspections } from "@/server/services/inspections";
import { inspectionStatusLabels, inspectionStatusTone } from "@/lib/labels";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";

export const metadata: Metadata = {
  title: "Minhas inspeções",
};

export default async function CampoInspectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const inspections = await listInspections(user.companyId, {
    status: params.status,
    technicianId: user.role === "TECHNICIAN" ? user.id : undefined,
  });

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/campo"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Voltar para hoje
      </Link>

      <PageHeader title="Minhas inspeções" description="Inspeções atribuídas a você." />

      <Card>
        <CardContent className="p-4">
          <form className="flex flex-wrap items-end gap-4" method="GET">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="q" className="sr-only">Buscar</Label>
              <Input
                id="q"
                name="q"
                placeholder="Buscar por ativo, checklist…"
                defaultValue={params.q}
                className="max-w-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <NativeSelect name="status" defaultValue={params.status ?? ""} aria-label="Filtrar por status">
                <option value="">Todos</option>
                <option value="PENDING">Pendentes</option>
                <option value="IN_PROGRESS">Em andamento</option>
                <option value="COMPLETED">Concluídas</option>
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
                    {insp.scheduledFor && <span>Agendada: {formatDate(insp.scheduledFor)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:ml-4">
                  <StatusBadge tone={inspectionStatusTone[insp.status]}>
                    {inspectionStatusLabels[insp.status]}
                  </StatusBadge>
                  <Link
                    href={`/campo/inspecoes/${insp.id}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    {insp.status === "PENDING" ? "Iniciar" : "Continuar"}
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