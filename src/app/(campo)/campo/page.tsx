import { ChevronRight, ClipboardList, Wrench } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { firstName, formatDate } from "@/lib/format";
import {
  priorityTone,
  workOrderPriorityLabels,
  workOrderStatusLabels,
  workOrderStatusTone,
} from "@/lib/labels";
import { requireUser } from "@/server/auth/session";
import { listFieldWorkOrders } from "@/server/services/work-orders";

export const metadata: Metadata = {
  title: "Meu dia",
};

export default async function FieldHomePage() {
  const user = await requireUser();
  const workOrders = await listFieldWorkOrders(user.companyId, user.id);
  const now = new Date();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-sm text-muted-foreground">Olá, {firstName(user.name)}</p>
        <h1 className="text-2xl font-semibold tracking-tight">Meu dia</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {workOrders.length === 0
            ? "Nenhuma OS atribuída a você."
            : `${workOrders.length} ${workOrders.length === 1 ? "OS atribuída" : "OS atribuídas"} a você.`}
        </p>
      </div>

      {workOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <Wrench aria-hidden className="size-8 text-muted-foreground" />
            <div>
              <p className="font-medium">Tudo em ordem por aqui</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Quando uma OS for atribuída a você, ela aparece nesta tela.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {workOrders.map((workOrder) => {
            const overdue =
              workOrder.dueAt !== null &&
              workOrder.dueAt < now &&
              workOrder.status !== "DONE" &&
              workOrder.status !== "CANCELED";

            return (
              <li key={workOrder.id}>
                <Card>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <ClipboardList aria-hidden className="size-3.5" />
                          OS #{workOrder.number}
                        </p>
                        <p className="mt-1 font-semibold">{workOrder.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {workOrder.client.name} · {workOrder.site.name}
                        </p>
                        {workOrder.asset ? (
                          <p className="text-sm text-muted-foreground">
                            {workOrder.asset.tag} — {workOrder.asset.name}
                          </p>
                        ) : null}
                      </div>
                      <StatusBadge tone={workOrderStatusTone[workOrder.status]}>
                        {workOrderStatusLabels[workOrder.status]}
                      </StatusBadge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <StatusBadge tone={priorityTone[workOrder.priority]}>
                        {workOrderPriorityLabels[workOrder.priority]}
                      </StatusBadge>
                      <span className={overdue ? "font-medium text-red-600" : "text-muted-foreground"}>
                        {workOrder.dueAt
                          ? `Prazo: ${formatDate(workOrder.dueAt)}${overdue ? " (atrasada)" : ""}`
                          : "Sem prazo definido"}
                      </span>
                    </div>

                    <Link
                      href={`/campo/os/${workOrder.id}`}
                      className={buttonVariants({ size: "lg", className: "w-full" })}
                    >
                      {workOrder.status === "OPEN" ? "Iniciar atendimento" : "Continuar OS"}
                      <ChevronRight aria-hidden />
                    </Link>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
