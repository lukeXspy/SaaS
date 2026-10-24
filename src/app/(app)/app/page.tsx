import {
  AlertTriangle,
  ArrowRight,
  Building2,
  ClipboardList,
  MapPin,
  Plus,
  Users,
  Wrench,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { firstName } from "@/lib/format";
import { requireUser } from "@/server/auth/session";
import { getAdminSummary } from "@/server/services/dashboard";

export const metadata: Metadata = {
  title: "Painel",
};

const stats = [
  {
    icon: Building2,
    label: "Clientes ativos",
    value: 0,
    href: "/app/clientes" as const,
    color: "text-sky-400 bg-sky-500/10 ring-sky-500/20",
    glow: "shadow-[0_0_20px_rgba(56,189,248,0.06)]",
  },
  {
    icon: MapPin,
    label: "Locais ativos",
    value: 0,
    href: "/app/clientes" as const,
    color: "text-violet-400 bg-violet-500/10 ring-violet-500/20",
    glow: "shadow-[0_0_20px_rgba(139,92,246,0.06)]",
  },
  {
    icon: Wrench,
    label: "Ativos em operação",
    value: 0,
    href: "/app/ativos" as const,
    color: "text-amber-400 bg-amber-500/10 ring-amber-500/20",
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.06)]",
  },
  {
    icon: ClipboardList,
    label: "OS em aberto",
    value: 0,
    href: "/app/ordens" as const,
    color: "text-emerald-400 bg-emerald-500/10 ring-emerald-500/20",
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.06)]",
  },
];

export default async function DashboardPage() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/campo");

  const summary = await getAdminSummary(user.companyId);

  // Preenche valores dinâmicos
  const values = [
    summary.activeClients,
    summary.activeSites,
    summary.activeAssets,
    summary.openWorkOrders,
  ];

  const shortcuts = [
    { href: "/app/ordens/nova", icon: Plus, label: "Nova OS", primary: true },
    { href: "/app/clientes/novo", icon: Plus, label: "Novo cliente" },
    { href: "/app/ativos/novo", icon: Plus, label: "Novo ativo" },
    { href: "/app/tecnicos", icon: Users, label: "Equipe" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="cinematic-in">
        <h1 className="text-2xl font-semibold tracking-tight">
          Olá, {firstName(user.name)}
        </h1>
        <p className="text-sm text-muted-foreground">{user.companyName}</p>
      </div>

      {/* Alert: OS atrasadas */}
      {summary.overdueWorkOrders > 0 ? (
        <div className="cinematic-in-1">
          <Card className="spring-pop border-amber-500/30 bg-amber-500/5">
            <CardContent className="flex items-start gap-3 text-sm text-amber-200">
              <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-amber-400" />
              <p>
                <strong className="text-amber-300">{summary.overdueWorkOrders}</strong>{" "}
                {summary.overdueWorkOrders === 1
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
      ) : null}

      {/* Stats — cards com glow cinematográfico */}
      <div className="cinematic-in-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="card-hover group rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Card className={`h-full gap-0 border-border/60 p-4 ${stat.glow}`}>
              <div
                className={`inline-flex size-9 items-center justify-center rounded-lg ring-1 ring-inset ${stat.color}`}
              >
                <stat.icon aria-hidden className="size-4" />
              </div>
              <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight">
                {values[i]}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Atalhos */}
      <section className="cinematic-in-3 flex flex-col gap-3">
        <h2 className="text-base font-semibold">Atalhos</h2>
        <div className="flex flex-wrap gap-2">
          {shortcuts.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className={buttonVariants({
                variant: s.primary ? "default" : "outline",
                size: "sm",
              })}
            >
              <s.icon aria-hidden className="size-4" />
              {s.label}
            </Link>
          ))}
          <Link
            href="/app/ordens"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Ver ordens
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}