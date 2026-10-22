import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/server/auth/session";
import { listActiveAssets, listActiveTemplates, listTechnicians } from "@/server/services/inspections";
import { InspectionForm } from "./inspection-form";

export const metadata: Metadata = {
  title: "Nova inspeção",
};

export default async function NewInspectionPage() {
  const user = await requireAdmin();
  const [assets, templates, technicians] = await Promise.all([
    listActiveAssets(user.companyId),
    listActiveTemplates(user.companyId),
    listTechnicians(user.companyId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/app/inspecoes"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Voltar para inspeções
      </Link>

      <PageHeader title="Nova inspeção" description="Agende uma inspeção para um ativo usando um checklist." />

      <Card>
        <CardContent>
          <InspectionForm assets={assets} templates={templates} technicians={technicians} />
        </CardContent>
      </Card>
    </div>
  );
}