import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toDateInput } from "@/lib/format";
import { requireAdmin } from "@/server/auth/session";
import { getWorkOrder, getWorkOrderOptions } from "@/server/services/work-orders";
import { WorkOrderForm } from "../../work-order-form";

export const metadata: Metadata = {
  title: "Editar OS",
};

export default async function EditWorkOrderPage({ params }: PageProps<"/app/ordens/[id]/editar">) {
  const user = await requireAdmin();
  const { id } = await params;

  const [workOrder, options] = await Promise.all([
    getWorkOrder(user.companyId, id, { userId: user.id, role: user.role }),
    getWorkOrderOptions(user.companyId),
  ]);

  if (!workOrder) notFound();

  const locked = workOrder.status === "DONE" || workOrder.status === "CANCELED";

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/app/ordens/${workOrder.id}`}
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Voltar para a OS
      </Link>

      <PageHeader
        title="Editar OS"
        description={`OS #${workOrder.number} · ${workOrder.title}`}
      />

      {locked ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-3 text-sm text-muted-foreground">
            <p>Esta OS está finalizada e não pode mais ser editada.</p>
            <Link
              href={`/app/ordens/${workOrder.id}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Ver OS
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <WorkOrderForm
              options={options}
              workOrder={{
                id: workOrder.id,
                siteId: workOrder.siteId,
                assetId: workOrder.assetId,
                type: workOrder.type,
                priority: workOrder.priority,
                title: workOrder.title,
                description: workOrder.description,
                assignedToId: workOrder.assignedToId,
                dueAt: toDateInput(workOrder.dueAt),
                scheduledAt: toDateInput(workOrder.scheduledAt),
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
