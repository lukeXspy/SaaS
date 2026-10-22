import { ArrowRight, Building2, ClipboardList, MapPin, Plus, Wrench } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { firstName } from "@/lib/format";
import { requireUser } from "@/server/auth/session";
import { getAdminSummary, getTechnicianSummary } from "@/server/services/dashboard";

export const metadata: Metadata = {
  title: "Painel",
};

export default async function DashboardPage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Olá, {firstName(user.name)}</h1>
        <p className="text-sm text-muted-foreground">{user.companyName}</p>
      </div>

      {isAdmin ? <AdminDashboard companyId={user.companyId} /> : <TechnicianDashboard userId={user.id} companyId={user.companyId} />}
    </div>
  );
}

async function AdminDashboard({ companyId }: { companyId: string }) {
  const summary = await getAdminSummary(companyId);

  const stats = [
    {
      label: "Clientes ativos",
      value: summary.activeClients,
      href: "/app/clientes" as const,
      icon: Building2,
    },
    {
      label: "Locais ativos",
      value: summary.activeSites,
      href: "/app/clientes" as const,
      icon: MapPin,
    },
    {
      label: "Ativos em operação",
      value: summary.activeAssets,
      href: "/app/ativos" as const,
      icon: Wrench,
    },
    {
      label: "OS em aberto",
      value: summary.openWorkOrders,
      href: null,
      icon: ClipboardList,
    },
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => {
          const content = (
            <Card className="h-full p-4">
              <stat.icon aria-hidden className="size-4 text-muted-foreground" />
              <p className="mt-3 text-2xl font-semibold tabular-nums">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </Card>
          );

          return stat.href ? (
            <Link
              key={stat.label}
              href={stat.href}
              className="rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {content}
            </Link>
          ) : (
            <div key={stat.label}>{content}</div>
          );
        })}
      </div>

      {summary.overdueWorkOrders > 0 ? (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
          <CardContent className="flex items-start gap-3 text-sm text-amber-900 dark:text-amber-200">
            <ClipboardList aria-hidden className="mt-0.5 size-4 shrink-0" />
            <p>
              <strong>{summary.overdueWorkOrders}</strong>{" "}
              {summary.overdueWorkOrders === 1
                ? "ordem de serviço está atrasada"
                : "ordens de serviço estão atrasadas"}
              . O acompanhamento completo estará disponível no módulo de ordens.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Atalhos</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/app/clientes/novo" className={buttonVariants({ variant: "outline" })}>
            <Plus aria-hidden />
            Novo cliente
          </Link>
          <Link href="/app/ativos/novo" className={buttonVariants({ variant: "outline" })}>
            <Plus aria-hidden />
            Novo ativo
          </Link>
          <Link href="/app/ativos" className={buttonVariants({ variant: "outline" })}>
            Ver ativos
            <ArrowRight aria-hidden />
          </Link>
        </div>
      </section>
    </>
  );
}

async function TechnicianDashboard({
  companyId,
  userId,
}: {
  companyId: string;
  userId: string;
}) {
  const summary = await getTechnicianSummary(companyId, userId);

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={summary.openAssigned > 0 ? "info" : "neutral"}>
            {summary.openAssigned} OS em aberto
          </StatusBadge>
          {summary.waitingParts > 0 ? (
            <StatusBadge tone="warning">
              {summary.waitingParts} aguardando peças
            </StatusBadge>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">
          A área de campo, com a lista das suas ordens de serviço e a execução no celular, será
          liberada no módulo de ordens de serviço.
        </p>
      </CardContent>
    </Card>
  );
}
