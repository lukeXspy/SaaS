import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { toDateInput } from "@/lib/format";
import { requireAdmin } from "@/server/auth/session";
import { getAsset, listSiteOptions } from "@/server/services/assets";
import { AssetForm } from "../../asset-form";

export const metadata: Metadata = {
  title: "Editar ativo",
};

export default async function EditAssetPage({ params }: PageProps<"/app/ativos/[id]/editar">) {
  const user = await requireAdmin();
  const { id } = await params;
  const [asset, sites] = await Promise.all([
    getAsset(user.companyId, id),
    listSiteOptions(user.companyId),
  ]);

  if (!asset) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/app/ativos/${asset.id}`}
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Voltar para o ativo
      </Link>

      <PageHeader title="Editar ativo" description={`TAG ${asset.tag} · ${asset.name}`} />

      <Card>
        <CardContent>
          <AssetForm
            sites={sites.map((site) => ({
              id: site.id,
              name: site.name,
              clientName: site.client.name,
            }))}
            asset={{
              id: asset.id,
              siteId: asset.siteId,
              tag: asset.tag,
              name: asset.name,
              category: asset.category,
              criticality: asset.criticality,
              status: asset.status,
              manufacturer: asset.manufacturer,
              model: asset.model,
              serialNumber: asset.serialNumber,
              locationNote: asset.locationNote,
              installationDate: toDateInput(asset.installationDate),
              warrantyUntil: toDateInput(asset.warrantyUntil),
              notes: asset.notes,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
