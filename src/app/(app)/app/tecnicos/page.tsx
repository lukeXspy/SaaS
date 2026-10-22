import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { requireAdmin } from "@/server/auth/session";
import { listUsers } from "@/server/services/users";
import { roleLabels } from "@/lib/labels";
import { formatDateTime } from "@/lib/format";
import { InviteForm } from "./invite-form";
import { RevokeInviteButton } from "./revoke-invite-button";

export const metadata: Metadata = {
  title: "Equipe",
};

export default async function TeamPage() {
  const user = await requireAdmin();
  const { users, invites } = await listUsers(user.companyId);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/app"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Voltar para painel
      </Link>

      <PageHeader
        title="Equipe"
        description="Gerencie técnicos e administradores da empresa."
      />

      {/* Formulário de convite */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Convidar pessoa</CardTitle>
        </CardHeader>
        <CardContent>
          <InviteForm />
        </CardContent>
      </Card>

      {/* Convites pendentes */}
      {invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Convites pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {invites.map((invite) => (
                <li
                  key={invite.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{invite.email}</p>
                    <p className="text-sm text-muted-foreground">
                      {roleLabels[invite.role]} · convidado por {invite.invitedBy.name} ·{" "}
                      expira em {formatDateTime(invite.expiresAt)}
                    </p>
                  </div>
                  <RevokeInviteButton inviteId={invite.id} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Lista de usuários */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Membros</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum membro na equipe.
            </p>
          ) : (
            <ul className="space-y-3">
              {users.map((u) => (
                <li
                  key={u.id}
                  className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${
                    !u.isActive ? "opacity-60" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/app/tecnicos/${u.id}`}
                      className="font-medium hover:underline"
                    >
                      {u.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">{u.email}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <StatusBadge tone={u.role === "ADMIN" ? "info" : "neutral"}>
                        {roleLabels[u.role]}
                      </StatusBadge>
                      <StatusBadge tone={u.isActive ? "success" : "danger"}>
                        {u.isActive ? "Ativo" : "Desativado"}
                      </StatusBadge>
                      <span>{u._count.assignedWorkOrders} OS</span>
                      <span>{u._count.inspections} inspeções</span>
                      {u.lastLoginAt && <span>· último login {formatDateTime(u.lastLoginAt)}</span>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}