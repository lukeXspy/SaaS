import { ArrowLeft, MapPin, Pencil, Phone, Plus, User } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/server/auth/session";
import { getClient } from "@/server/services/clients";
import { toggleClientActiveAction, toggleSiteActiveAction } from "@/server/actions/clients";
import { ClientForm } from "../client-form";
import { SiteForm } from "../site-form";

export const metadata: Metadata = {
  title: "Detalhe do cliente",
};

export default async function ClientDetailPage({ params }: PageProps<"/app/clientes/[id]">) {
  const user = await requireAdmin();
  const { id } = await params;
  const client = await getClient(user.companyId, id);

  if (!client) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/app/clientes"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Voltar para clientes
      </Link>

      <PageHeader
        title={client.name}
        description={[client.tradeName, client.document].filter(Boolean).join(" · ") || undefined}
        action={
          <StatusBadge tone={client.isActive ? "success" : "neutral"}>
            {client.isActive ? "Ativo" : "Inativo"}
          </StatusBadge>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <p className="flex items-center gap-2">
              <Phone aria-hidden className="size-4 text-muted-foreground" />
              {client.phone || "Telefone não informado"}
            </p>
            <p className="truncate">
              <span className="text-muted-foreground">E-mail: </span>
              {client.email || "não informado"}
            </p>
          </div>

          {client.notes ? (
            <p className="rounded-lg bg-muted px-3 py-2 text-sm whitespace-pre-line">{client.notes}</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <details className="w-full">
              <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-sm font-medium text-foreground underline-offset-4 hover:underline">
                <Pencil aria-hidden className="size-4" />
                Editar dados do cliente
              </summary>
              <div className="mt-4 rounded-xl border p-4">
                <ClientForm client={client} />
              </div>
            </details>
          </div>

          <form action={toggleClientActiveAction}>
            <input type="hidden" name="id" value={client.id} />
            <input type="hidden" name="isActive" value={String(client.isActive)} />
            <SubmitButton variant="outline" size="sm" pendingText="Atualizando…">
              {client.isActive ? "Desativar cliente" : "Reativar cliente"}
            </SubmitButton>
          </form>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Locais</h2>
          <span className="text-sm text-muted-foreground">
            {client.sites.length} {client.sites.length === 1 ? "local" : "locais"}
          </span>
        </div>

        {client.sites.length === 0 ? (
          <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            Nenhum local cadastrado. Adicione o primeiro endereço atendido.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {client.sites.map((site) => (
              <li key={site.id}>
                <Card className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium">{site.name}</p>
                      <p className="mt-1 flex items-start gap-1 text-sm text-muted-foreground">
                        <MapPin aria-hidden className="mt-0.5 size-4 shrink-0" />
                        <span>
                          {[
                            site.addressLine,
                            site.number,
                            site.complement,
                            site.district,
                            `${site.city}-${site.state}`,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </p>
                      {site.contactName ? (
                        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <User aria-hidden className="size-4" />
                          {site.contactName}
                          {site.contactPhone ? ` · ${site.contactPhone}` : ""}
                        </p>
                      ) : null}
                    </div>
                    <StatusBadge tone={site.isActive ? "success" : "neutral"}>
                      {site.isActive ? "Ativo" : "Inativo"}
                    </StatusBadge>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {site._count.assets} {site._count.assets === 1 ? "ativo" : "ativos"}
                    </span>
                    <Link
                      href={`/app/locais/${site.id}/editar`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Editar local
                    </Link>
                    <form action={toggleSiteActiveAction}>
                      <input type="hidden" name="id" value={site.id} />
                      <input type="hidden" name="isActive" value={String(site.isActive)} />
                      <SubmitButton variant="ghost" size="sm" pendingText="Atualizando…">
                        {site.isActive ? "Desativar" : "Reativar"}
                      </SubmitButton>
                    </form>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}

        <details className="rounded-xl border p-4">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-sm font-medium underline-offset-4 hover:underline">
            <Plus aria-hidden className="size-4" />
            Adicionar local
          </summary>
          <div className="mt-4">
            <SiteForm clientId={client.id} />
          </div>
        </details>
      </section>
    </div>
  );
}
