import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  MapPin,
  PlayCircle,
  Plus,
  Timer,
  UserCheck,
  Wrench,
  XCircle,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { firstName, formatDate, formatDateTime } from "@/lib/format";
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
    {
      icon: Building2,
      label: "Clientes",
      value: s.activeClients,
      href: "/app/clientes",
      color: "text-sky-400 bg-sky-500/10 ring-sky-500/20",
      glow: "shadow-[0_0_24px_rgba(56,189,248,0.06)]",
    },
    {
      icon: MapPin,
      label: "Locais",
      value: s.activeSites,
      href: "/app/clientes",
      color: "text-violet-400 bg-violet-500/10 ring-violet-500/20",
      glow: "shadow-[0_0_24px_rgba(139,92,246,0.06)]",
    },
    {
      icon: Wrench,
      label: "Ativos",
      value: s.activeAssets,
      href: "/app/ativos",
      color: "text-amber-400 bg-amber-500/10 ring-amber-500/20",
      glow: "shadow-[0_0_24px_rgba(245,158,11,0.06)]",
    },
    {
      icon: ClipboardList,
      label: "OS abertas",
      value: s.openWorkOrders,
      href: "/app/ordens",
      color: "text-emerald-400 bg-emerald-500/10 ring-emerald-500/20",
      glow: "shadow-[0_0_24px_rgba(16,185,129,0.06)]",
    },
  ];

  const statusItems = [
    { label: "Aberta", value: s.statusBreakdown.open, color: "bg-sky-400", icon: ClipboardList },
    { label: "Em andamento", value: s.statusBreakdown.inProgress, color: "bg-amber-400", icon: PlayCircle },
    { label: "Aguardando peças", value: s.statusBreakdown.waitingParts, color: "bg-violet-400", icon: Timer },
    { label: "Concluída", value: s.statusBreakdown.done, color: "bg-emerald-400", icon: CheckCircle2 },
    { label: "Cancelada", value: s.statusBreakdown.canceled, color: "bg-slate-500", icon: XCircle },
  ];

  const totalOs = statusItems.reduce((sum, item) => sum + item.value, 0);

  const shortcuts = [
    { href: "/app/ordens/nova", icon: Plus, label: "Nova OS", primary: true },
    { href: "/app/clientes/novo", icon: Plus, label: "Novo cliente" },
    { href: "/app/ativos/novo", icon: Plus, label: "Novo ativo" },
    { href: "/app/tecnicos", icon: UserCheck, label: "Equipe" },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* ═══ Header ═══ */}
      <div className="cinematic-in">
        <h1 className="text-2xl font-semibold tracking-tight">
          Olá, {firstName(user.name)}
        </h1>
        <p className="text-sm text-muted-foreground">
          {user.companyName} · {formatDateTime(now)}
        </p>
      </div>

      {/* ═══ Alert: OS atrasadas ═══ */}
      {s.overdueWorkOrders > 0 && (
        <div className="cinematic-in-1">
          <Card className="spring-pop border-amber-500/30 bg-amber-500/5">
            <CardContent className="flex items-start gap-3 text-sm text-amber-200">
              <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-amber-400" />
              <p>
                <strong className="text-amber-300">{s.overdueWorkOrders}</strong>{" "}
                {s.overdueWorkOrders === 1
                  ? "ordem de serviço está atrasada."
                  : "ordens de serviço estão atrasadas."}{" "}
                <Link
                  href="/app/ordens"
                  className="font-medium text-amber-300 underline underline-offset-4 hover:text-amber-200"
                >
                  Ver ordens →
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══ Stats ═══ */}
      <div className="cinematic-in-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="card-hover group rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Card className={`h-full gap-0 border-border/60 p-4 ${stat.glow}`}>
              <div className="flex items-start justify-between">
                <div
                  className={`inline-flex size-9 items-center justify-center rounded-lg ring-1 ring-inset ${stat.color}`}
                >
                  <stat.icon aria-hidden className="size-4" />
                </div>
                <ChevronRight
                  aria-hidden
                  className="size-4 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-muted-foreground"
                />
              </div>
              <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight">
                {stat.value}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* ═══ Two-column: OS recentes + breakdown ═══ */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* ── Coluna esquerda: OS recentes ── */}
        <div className="cinematic-in-3 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Ordens recentes</h2>
            <Link
              href="/app/ordens"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              Ver todas
              <ArrowRight aria-hidden className="size-3.5" />
            </Link>
          </div>

          {s.recentWorkOrders.length === 0 ? (
            <Card className="border-border/60">
              <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                <ClipboardList aria-hidden className="size-8 text-muted-foreground/50" />
                <div>
                  <p className="text-sm font-medium">Nenhuma OS criada ainda</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Crie a primeira ordem de serviço da sua equipe.
                  </p>
                </div>
                <Link
                  href="/app/ordens/nova"
                  className={buttonVariants({ size: "sm" })}
                >
                  <Plus aria-hidden className="size-4" />
                  Nova OS
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/60 p-0">
              <ul className="divide-y divide-border/40">
                {s.recentWorkOrders.map((wo) => {
                  const overdue =
                    wo.dueAt !== null &&
                    wo.dueAt < now &&
                    wo.status !== "DONE" &&
                    wo.status !== "CANCELED";

                  return (
                    <li key={wo.id}>
                      <Link
                        href={`/app/ordens/${wo.id}`}
                        className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/40"
                      >
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground">
                              OS #{wo.number}
                            </span>
                            <StatusBadge tone={workOrderStatusTone[wo.status]}>
                              {workOrderStatusLabels[wo.status]}
                            </StatusBadge>
                            <StatusBadge tone={priorityTone[wo.priority]}>
                              {workOrderPriorityLabels[wo.priority]}
                            </StatusBadge>
                          </div>
                          <p className="truncate text-sm font-medium">{wo.title}</p>
                          <p className="flex items-center gap-2 text-xs text-muted-foreground">
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
                                  className={`inline-flex items-center gap-1 shrink-0 ${
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
                          className="size-4 shrink-0 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-muted-foreground"
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </div>

        {/* ── Coluna direita: breakdown + equipe ═══ */}
        <div className="cinematic-in-4 flex flex-col gap-4">
          {/* OS por status */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                OS por status
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {statusItems.map((item) => {
                const pct = totalOs > 0 ? (item.value / totalOs) * 100 : 0;
                return (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-medium tabular-nums text-foreground">
                          {item.value}
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${item.color} transition-all duration-700`}
                          style={{ width: `${Math.max(pct, item.value > 0 ? 4 : 0)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Equipe */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Equipe
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Técnicos ativos</span>
                <span className="font-semibold tabular-nums">{s.activeTechnicians}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">OS concluídas este mês</span>
                <span className="font-semibold tabular-nums text-emerald-400">
                  {s.completedThisMonth}
                </span>
              </div>
              <Link
                href="/app/tecnicos"
                className="tactile mt-2 inline-flex items-center justify-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <UserCheck aria-hidden className="size-3.5" />
                Gerenciar equipe
              </Link>
            </CardContent>
          </Card>

          {/* Atalhos rápidos */}
          <div className="flex flex-col gap-2">
            {shortcuts.map((sc) => (
              <Link
                key={sc.href}
                href={sc.href}
                className={`tactile flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  sc.primary
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
                    : "border border-border/60 bg-muted/40 hover:bg-muted"
                }`}
              >
                <sc.icon aria-hidden className="size-4" />
                {sc.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}