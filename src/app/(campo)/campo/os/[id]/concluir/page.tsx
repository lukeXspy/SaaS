import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { formatMinutes, formatQuantity } from "@/lib/format";
import { requireUser } from "@/server/auth/session";
import { getWorkOrder } from "@/server/services/work-orders";
import { ConclusionForm } from "./conclusion-form";

export const metadata: Metadata = {
  title: "Concluir OS",
};

export default async function ConcludeWorkOrderPage({
  params,
}: PageProps<"/campo/os/[id]/concluir">) {
  const user = await requireUser();
  const { id } = await params;
  const workOrder = await getWorkOrder(user.companyId, id, {
    userId: user.id,
    role: user.role,
  });

  if (!workOrder) notFound();
  if (workOrder.status !== "IN_PROGRESS" || !workOrder.execution) {
    redirect(`/campo/os/${workOrder.id}`);
  }

  return (
    <div className="flex flex-col gap-5">
      <Link
        href={`/campo/os/${workOrder.id}`}
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Voltar para a OS
      </Link>

      <PageHeader
        title="Concluir OS"
        description={`OS #${workOrder.number} · ${workOrder.title}`}
      />

      <Card>
        <CardContent className="flex flex-col gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Diagnóstico</p>
            <p className="whitespace-pre-line">{workOrder.execution.diagnosis || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Solução</p>
            <p className="whitespace-pre-line">{workOrder.execution.solution || "—"}</p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <p>
              <span className="text-muted-foreground">Tempo: </span>
              <span className="font-medium">
                {formatMinutes(workOrder.execution.laborMinutes)}
              </span>
            </p>
            <p>
              <span className="text-muted-foreground">Itens: </span>
              <span className="font-medium">
                {workOrder.items.length === 0
                  ? "nenhum"
                  : workOrder.items
                      .map((item) => `${formatQuantity(item.quantity)} ${item.description}`)
                      .join(", ")}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <ConclusionForm workOrderId={workOrder.id} />
        </CardContent>
      </Card>

      <p className="pb-4 text-xs text-muted-foreground">
        Ao concluir, a OS fica bloqueada para edição e o cliente recebe o registro com a assinatura.
      </p>
    </div>
  );
}
