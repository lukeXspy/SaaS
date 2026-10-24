import {
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  MapPin,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { firstName, formatDate } from "@/lib/format";
import {
  priorityTone,
  workOrderPriorityLabels,
  workOrderStatusLabels,
  workOrderStatusTone,
} from "@/lib/labels";
import { requireUser } from "@/server/auth/session";
import { listFieldWorkOrders } from "@/server/services/work-orders";

export const metadata: Metadata = {
  title: "Meu dia",
};

export default async function FieldHomePage() {
  const user = await requireUser();
  const workOrders = await listFieldWorkOrders(user.companyId, user.id);
  const now = new Date();

  const activeCount = workOrders.filter(
    (wo) =>
      wo.status === "OPEN" ||
      wo.status === "IN_PROGRESS" ||
      wo.status === "WAITING_PARTS",
  ).length;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="cinematic-in">
        <p className="text-sm text-muted-foreground">Olá, {firstName(user.name)}</p>
        <h1 className="text-2xl font-semibold tracking-tight">Meu dia</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {workOrders.length === 0
            ? "Nenhuma OS atribuída a você."
            : activeCount > 0
              ? `${activeCount} ${activeCount === 1 ? "OS em andamento" : "OS em andamento"} de ${workOrders.length}.`
              : `${workOrders.length} ${workOrders.length === 1 ? "OS atribuída" : "OS atribuídas"} a você.`}
        </p>
      </div>

      {/* Lista de OS */}
      {workOrders.length === 0 ? (
        <EmptyState
          className="cinematic-in-1"
          icon={CheckCircle2}
          title="Tudo em ordem por aqui"
          description="Quando uma OS for atribuída a você, ela aparece nesta tela."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {workOrders.map((wo, i) => {
            const overdue =
              wo.dueAt !== null &&
              wo.dueAt < now &&
              wo.status !== "DONE" &&
              wo.status !== "CANCELED";

            return (
              <li key={wo.id} className={`cinematic-in-${Math.min(i + 1, 4)}`}>
                <Card
                  className={`card-hover border-border/60 ${
                    overdue ? "border-red-500/30" : ""
                  }`}
                >
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <ClipboardList aria-hidden className="size-3.5" />
                          OS #{wo.number}
                        </p>
                        <p className="mt-1 font-semibold">{wo.title}</p>
                        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin aria-hidden className="size-3.5 shrink-0" />
                          {wo.client.name} · {wo.site.name}
                        </p>
                        {wo.asset ? (
                          <p className="text-sm text-muted-foreground">
                            {wo.asset.tag} — {wo.asset.name}
                          </p>
                        ) : null}
                      </div>
                      <StatusBadge
                        tone={workOrderStatusTone[wo.status]}
                        pulse={
                          wo.status === "IN_PROGRESS" ||
                          wo.status === "WAITING_PARTS"
                        }
                      >
                        {workOrderStatusLabels[wo.status]}
                      </StatusBadge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <StatusBadge tone={priorityTone[wo.priority]}>
                        {workOrderPriorityLabels[wo.priority]}
                      </StatusBadge>
                      <span
                        className={`inline-flex items-center gap-1 ${
                          overdue
                            ? "font-medium text-red-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        <Clock aria-hidden className="size-3.5" />
                        {wo.dueAt
                          ? `${formatDate(wo.dueAt)}${overdue ? " · atrasada" : ""}`
                          : "Sem prazo"}
                      </span>
                    </div>

                    <Link
                      href={`/campo/os/${wo.id}`}
                      className="tactile group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
                    >
                      {wo.status === "OPEN" ? "Iniciar atendimento" : "Continuar OS"}
                      <ChevronRight
                        aria-hidden
                        className="size-4 transition-transform group-hover:translate-x-0.5"
                      />
                    </Link>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}