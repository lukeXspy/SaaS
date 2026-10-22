import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/server/auth/session";
import { listSiteOptions } from "@/server/services/assets";
import { AssetForm } from "../asset-form";

export const metadata: Metadata = {
  title: "Novo ativo",
};

export default async function NewAssetPage() {
  const user = await requireAdmin();
  const sites = await listSiteOptions(user.companyId);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/app/ativos"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Voltar para ativos
      </Link>

      <PageHeader
        title="Novo ativo"
        description="Cadastre o equipamento para gerar o QR Code e vincular ordens de serviço."
      />

      {sites.length === 0 ? (
        <EmptyState
          title="Cadastre um local primeiro"
          description="Todo ativo pertence a um local de cliente. Cadastre um cliente e um local antes de continuar."
          action={
            <Link href="/app/clientes/novo" className={buttonVariants({ size: "sm" })}>
              Cadastrar cliente
            </Link>
          }
        />
      ) : (
        <Card>
          <CardContent>
            <AssetForm
              sites={sites.map((site) => ({
                id: site.id,
                name: site.name,
                clientName: site.client.name,
              }))}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
