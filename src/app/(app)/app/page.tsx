import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  PlayCircle,
  Plus,
  Timer,
  UserCheck,
  XCircle,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { firstName, formatDate } from "@/lib/format";
import {
  priorityTone,
  workOrderPriorityLabels,
  workOrderStatusLabels,
  workOrderStatusTone,
} from "@/lib/labels";
import { requireUser } from "@/server/auth/session";
import { getAdminSummary } from "@/server/services/dashboard";

export const metadata: Metadata = {
  title: "Painel",
};

export default async function DashboardPage() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/campo");

  const s = await getAdminSummary(user.companyId);
  const now = new Date();

  const stats = [
    { label: "Clientes", value: s.activeClients, href: "/app/clientes" },
    { label: "Locais", value: s.activeSites, href: "/app/clientes" },
    { label: "Ativos", value: s.activeAssets, href: "/app/ativos" },
    { label: "OS abertas", value: s.openWorkOrders, href: "/app/ordens" },
  ];

  const statusItems = [
    { label: "Aberta", value: s.statusBreakdown.open, color: "bg-sky-400", icon: ClipboardList },
    { label: "Em andamento", value: s.statusBreakdown.inProgress, color: "bg-amber-400", icon: PlayCircle },
    { label: "Aguardando peças", value: s.statusBreakdown.waitingParts, color: "bg-violet-400", icon: Timer },
    { label: "Concluída", value: s.statusBreakdown.done, color: "bg-emerald-400", icon: CheckCircle2 },
    { label: "Cancelada", value: s.statusBreakdown.canceled, color: "bg-slate-500", icon: XCircle },
  ];

  const totalOs = statusItems.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* ═══ Header — título + CTA ═══ */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Olá, {firstName(user.name)}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{user.companyName}</p>
        </div>
        <Link
          href="/app/ordens/nova"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus aria-hidden className="size-4" />
          Nova OS
        </Link>
      </div>

      {/* ═══ Alert — banner fino, não Card ═══ */}
      {s.overdueWorkOrders > 0 && (
        <div className="flex h-10 items-center gap-3 rounded-lg border-l-2 border-amber-500/50 bg-amber-500/8 px-4 text-sm text-amber-200">
          <AlertTriangle aria-hidden className="size-4 shrink-0 text-amber-400" />
          <p>
            <strong className="font-semibold text-amber-300">
              {s.overdueWorkOrders}
            </strong>{" "}
            {s.overdueWorkOrders === 1
              ? "OS está atrasada."
              : "OS estão atrasadas."}{" "}
            <Link
              href="/app/ordens"
              className="font-medium text-amber-300 underline underline-offset-4 hover:text-amber-200"
            >
              Ver ordens
            </Link>
          </p>
        </div>
      )}

      {/* ═══ Stats — limpos, sem ícone, sem glow ═══ */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-lg border border-border/60 bg-card px-4 py-3 outline-none hover:bg-card/80 focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <p className="text-2xl font-semibold tabular-nums tracking-tight">
              {stat.value}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* ═══ Two-column — OS recentes + breakdown ═══ */}
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        {/* ── Coluna esquerda: OS recentes (dense rows) ── */}
        <div className="min-w-0 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium">Ordens recentes</h2>
            <Link
              href="/app/ordens"
              className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground"
            >
              Ver todas
              <ArrowRight aria-hidden className="size-3.5" />
            </Link>
          </div>

          {s.recentWorkOrders.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-10 text-center">
              <ClipboardList aria-hidden className="size-6 text-muted-foreground/50" />
              <div>
                <p className="text-sm font-medium">Nenhuma OS criada</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Crie a primeira ordem de serviço da sua equipe.
                </p>
              </div>
              <Link
                href="/app/ordens/nova"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Plus aria-hidden className="size-3.5" />
                Criar OS
              </Link>
            </div>
          ) : (
            <div className="rounded-lg border border-border/60 bg-card">
              <ul>
                {s.recentWorkOrders.map((wo) => {
                  const overdue =
                    wo.dueAt !== null &&
                    wo.dueAt < now &&
                    wo.status !== "DONE" &&
                    wo.status !== "CANCELED";

                  return (
                    <li key={wo.id} className="border-b border-border/40 last:border-0">
                      <Link
                        href={`/app/ordens/${wo.id}`}
                        className="group flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30"
                      >
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium tabular-nums text-muted-foreground">
                              OS #{wo.number}
                            </span>
                            <StatusBadge tone={workOrderStatusTone[wo.status]}>
                              {workOrderStatusLabels[wo.status]}
                            </StatusBadge>
                            <StatusBadge tone={priorityTone[wo.priority]}>
                              {workOrderPriorityLabels[wo.priority]}
                            </StatusBadge>
                          </div>
                          <p className="truncate text-[13px] font-medium">
                            {wo.title}
                          </p>
                          <p className="flex items-center gap-2 truncate text-xs text-muted-foreground">
                            <span className="truncate">{wo.client.name}</span>
                            {wo.assignedTo && (
                              <>
                                <span aria-hidden>·</span>
                                <span className="shrink-0">{wo.assignedTo.name}</span>
                              </>
                            )}
                            {wo.dueAt && (
                              <>
                                <span aria-hidden>·</span>
                                <span
                                  className={`inline-flex shrink-0 items-center gap-1 ${
                                    overdue ? "font-medium text-red-400" : ""
                                  }`}
                                >
                                  <Clock aria-hidden className="size-3" />
                                  {formatDate(wo.dueAt)}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                        <ChevronRight
                          aria-hidden
                          className="size-4 shrink-0 text-muted-foreground/30 group-hover:text-muted-foreground"
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* ── Coluna direita: breakdown + equipe ── */}
        <div className="flex flex-col gap-4">
          {/* OS por status */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                OS por status
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              {statusItems.map((item) => {
                const pct = totalOs > 0 ? (item.value / totalOs) * 100 : 0;
                return (
                  <div key={item.label} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium tabular-nums">
                        {item.value}
                      </span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width: `${Math.max(pct, item.value > 0 ? 3 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Equipe */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Equipe
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-muted-foreground">Técnicos ativos</span>
                <span className="font-semibold tabular-nums">
                  {s.activeTechnicians}
                </span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-muted-foreground">Concluídas este mês</span>
                <span className="font-semibold tabular-nums text-emerald-400">
                  {s.completedThisMonth}
                </span>
              </div>
              <Link
                href="/app/tecnicos"
                className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              >
                <UserCheck aria-hidden className="size-3.5" />
                Gerenciar equipe
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}