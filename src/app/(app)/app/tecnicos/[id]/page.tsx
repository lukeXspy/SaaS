import { ArrowLeft, Power } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { requireAdmin } from "@/server/auth/session";
import { getUser } from "@/server/services/users";
import { roleLabels, workOrderStatusLabels, workOrderStatusTone, workOrderPriorityLabels, priorityTone } from "@/lib/labels";
import { formatDate, formatDateTime } from "@/lib/format";
import { ResetLinkButton } from "./reset-link-button";
import { toggleUserActiveAction } from "@/server/actions/users";

export const metadata: Metadata = {
  title: "Ficha do membro",
};

export default async function UserDetailPage({ params }: PageProps<"/app/tecnicos/[id]">) {
  const admin = await requireAdmin();
  const { id } = await params;
  const user = await getUser(admin.companyId, id);

  if (!user) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/app/tecnicos"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Voltar para equipe
      </Link>

      <PageHeader
        title={user.name}
        description={user.email}
        action={
          user.id !== admin.id ? (
            <form action={toggleUserActiveAction}>
              <input type="hidden" name="userId" value={user.id} />
              <input type="hidden" name="isActive" value={String(user.isActive)} />
              <button
                type="submit"
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
                  user.isActive
                    ? "border text-destructive hover:bg-destructive/10"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                <Power aria-hidden className="size-4" />
                {user.isActive ? "Desativar" : "Reativar"}
              </button>
            </form>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Dados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <StatusBadge tone={user.role === "ADMIN" ? "info" : "neutral"}>
                {roleLabels[user.role]}
              </StatusBadge>
              <StatusBadge tone={user.isActive ? "success" : "danger"}>
                {user.isActive ? "Ativo" : "Desativado"}
              </StatusBadge>
            </div>
            {user.phone && <p className="text-sm">{user.phone}</p>}
            <p className="text-sm text-muted-foreground">
              Criado em {formatDateTime(user.createdAt)}
            </p>
            {user.lastLoginAt && (
              <p className="text-sm text-muted-foreground">
                Último login: {formatDateTime(user.lastLoginAt)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Estatísticas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-bold">{user._count.assignedWorkOrders}</p>
            <p className="text-sm text-muted-foreground">OS atribuídas</p>
            <p className="text-lg font-semibold mt-2">{user._count.executions}</p>
            <p className="text-sm text-muted-foreground">Execuções registradas</p>
            <p className="text-lg font-semibold mt-2">{user._count.inspections}</p>
            <p className="text-sm text-muted-foreground">Inspeções</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Redefinir senha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResetLinkButton userId={user.id} userName={user.name} />
          </CardContent>
        </Card>

        {user.assignedWorkOrders.length > 0 && (
          <Card className="sm:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                OS recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {user.assignedWorkOrders.map((wo) => (
                  <li
                    key={wo.id}
                    className="flex items-center justify-between gap-3 rounded-lg border p-2"
                  >
                    <Link
                      href={`/app/ordens/${wo.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      OS #{wo.number} — {wo.title}
                    </Link>
                    <div className="flex items-center gap-2">
                      <StatusBadge tone={priorityTone[wo.priority]}>
                        {workOrderPriorityLabels[wo.priority]}
                      </StatusBadge>
                      <StatusBadge tone={workOrderStatusTone[wo.status]}>
                        {workOrderStatusLabels[wo.status]}
                      </StatusBadge>
                      {wo.dueAt && (
                        <span className="text-xs text-muted-foreground">
                          {formatDate(wo.dueAt)}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}