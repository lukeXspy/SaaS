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

const statConfig = {
  clients: { icon: Building2, accent: "text-sky-600 bg-sky-50 dark:bg-sky-950" },
  sites: { icon: MapPin, accent: "text-violet-600 bg-violet-50 dark:bg-violet-950" },
  assets: { icon: Wrench, accent: "text-amber-600 bg-amber-50 dark:bg-amber-950" },
  orders: { icon: ClipboardList, accent: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950" },
} as const;

export default async function DashboardPage() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/campo");

  const summary = await getAdminSummary(user.companyId);

  const stats = [
    { ...statConfig.clients, label: "Clientes ativos", value: summary.activeClients, href: "/app/clientes" as const },
    { ...statConfig.sites, label: "Locais ativos", value: summary.activeSites, href: "/app/clientes" as const },
    { ...statConfig.assets, label: "Ativos em operação", value: summary.activeAssets, href: "/app/ativos" as const },
    { ...statConfig.orders, label: "OS em aberto", value: summary.openWorkOrders, href: "/app/ordens" as const },
  ];

  const shortcuts: Array<{
    href: string;
    icon: typeof Plus;
    label: string;
    primary?: boolean;
  }> = [
    { href: "/app/ordens/nova", icon: Plus, label: "Nova OS", primary: true },
    { href: "/app/clientes/novo", icon: Plus, label: "Novo cliente" },
    { href: "/app/ativos/novo", icon: Plus, label: "Novo ativo" },
    { href: "/app/tecnicos", icon: Users, label: "Equipe" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="animate-fade-up">
        <h1 className="text-2xl font-semibold tracking-tight">
          Olá, {firstName(user.name)}
        </h1>
        <p className="text-sm text-muted-foreground">{user.companyName}</p>
      </div>

      {/* Alert: OS atrasadas */}
      {summary.overdueWorkOrders > 0 ? (
        <div className="animate-fade-up-1">
          <Card className="border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/50">
            <CardContent className="flex items-start gap-3 text-sm text-amber-900 dark:text-amber-200">
              <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
              <p>
                <strong>{summary.overdueWorkOrders}</strong>{" "}
                {summary.overdueWorkOrders === 1
                  ? "ordem de serviço está atrasada."
                  : "ordens de serviço estão atrasadas."}{" "}
                <Link
                  href="/app/ordens"
                  className="font-medium underline underline-offset-4"
                >
                  Ver ordens →
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Stats */}
      <div className="animate-fade-up-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="card-hover group rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Card className="h-full gap-0 p-4">
              <div
                className={`inline-flex size-9 items-center justify-center rounded-lg ${stat.accent}`}
              >
                <stat.icon aria-hidden className="size-4" />
              </div>
              <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight">
                {stat.value}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Atalhos */}
      <section className="animate-fade-up-3 flex flex-col gap-3">
        <h2 className="text-base font-semibold">Atalhos rápidos</h2>
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
            Ver todas as ordens
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}