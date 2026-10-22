import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/server/auth/session";
import { getSite } from "@/server/services/clients";
import { SiteForm } from "../../../clientes/site-form";

export const metadata: Metadata = {
  title: "Editar local",
};

export default async function EditSitePage({ params }: PageProps<"/app/locais/[id]/editar">) {
  const user = await requireAdmin();
  const { id } = await params;
  const site = await getSite(user.companyId, id);

  if (!site) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/app/clientes/${site.client.id}`}
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Voltar para {site.client.name}
      </Link>

      <PageHeader title="Editar local" description={`${site.name} · ${site.client.name}`} />

      <Card>
        <CardContent>
          <SiteForm clientId={site.clientId} site={site} />
        </CardContent>
      </Card>
    </div>
  );
}
