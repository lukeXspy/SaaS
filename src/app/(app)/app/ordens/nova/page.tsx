import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/server/auth/session";
import { getWorkOrderOptions } from "@/server/services/work-orders";
import { WorkOrderForm } from "../work-order-form";

export const metadata: Metadata = {
  title: "Nova OS",
};

export default async function NewWorkOrderPage() {
  const user = await requireAdmin();
  const options = await getWorkOrderOptions(user.companyId);

  const hasSites = options.clients.some((client) => client.sites.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/app/ordens"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Voltar para ordens
      </Link>

      <PageHeader
        title="Nova ordem de serviço"
        description="Abra uma OS para um cliente e atribua o responsável."
      />

      {!hasSites ? (
        <EmptyState
          title="Cadastre um local primeiro"
          description="Toda OS pertence a um local de cliente. Cadastre um cliente com pelo menos um local."
          action={
            <Link href="/app/clientes/novo" className={buttonVariants({ size: "sm" })}>
              Cadastrar cliente
            </Link>
          }
        />
      ) : (
        <Card>
          <CardContent>
            <WorkOrderForm options={options} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
