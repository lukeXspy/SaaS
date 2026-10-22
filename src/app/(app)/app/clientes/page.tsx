import { Plus, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireAdmin } from "@/server/auth/session";
import { listClients } from "@/server/services/clients";

export const metadata: Metadata = {
  title: "Clientes",
};

export default async function ClientsPage({ searchParams }: PageProps<"/app/clientes">) {
  const user = await requireAdmin();
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const clients = await listClients(user.companyId, query);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Clientes"
        description="Empresas e condomínios atendidos pela sua equipe."
        action={
          <Link href="/app/clientes/novo" className={buttonVariants({ size: "sm" })}>
            <Plus aria-hidden />
            Novo cliente
          </Link>
        }
      />

      <form method="get" className="flex gap-2">
        <div className="relative flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            name="q"
            defaultValue={query}
            placeholder="Buscar por nome, fantasia ou documento"
            className="pl-9"
            aria-label="Buscar clientes"
          />
        </div>
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
      </form>

      {clients.length === 0 ? (
        <EmptyState
          title={query ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
          description={
            query
              ? "Tente outro termo de busca ou cadastre um novo cliente."
              : "Cadastre o primeiro cliente para começar a organizar locais, ativos e ordens de serviço."
          }
          action={
            <Link href="/app/clientes/novo" className={buttonVariants({ size: "sm" })}>
              Cadastrar cliente
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {clients.map((client) => (
            <li key={client.id}>
              <Card className="p-4">
                <Link href={`/app/clientes/${client.id}`} className="block">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{client.name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {[client.tradeName, client.document].filter(Boolean).join(" · ") ||
                          "Sem nome fantasia ou documento"}
                      </p>
                    </div>
                    <StatusBadge tone={client.isActive ? "success" : "neutral"}>
                      {client.isActive ? "Ativo" : "Inativo"}
                    </StatusBadge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>
                      {client._count.sites} {client._count.sites === 1 ? "local" : "locais"}
                    </span>
                    {client.phone ? <span>{client.phone}</span> : null}
                    {client.email ? <span className="truncate">{client.email}</span> : null}
                  </div>
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
