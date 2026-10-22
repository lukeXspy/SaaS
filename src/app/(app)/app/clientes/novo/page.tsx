import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/server/auth/session";
import { ClientForm } from "../client-form";

export const metadata: Metadata = {
  title: "Novo cliente",
};

export default async function NewClientPage() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/app/clientes"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Voltar para clientes
      </Link>

      <PageHeader title="Novo cliente" description="Cadastre a empresa ou condomínio atendido." />

      <Card>
        <CardContent>
          <ClientForm />
        </CardContent>
      </Card>
    </div>
  );
}
