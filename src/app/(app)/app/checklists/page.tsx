import { ArrowLeft, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/server/auth/session";
import { listChecklists } from "@/server/services/checklists";
import { assetCategoryLabels } from "@/lib/labels";

export const metadata: Metadata = {
  title: "Checklists",
};

export default async function ChecklistsPage() {
  const user = await requireAdmin();
  const checklists = await listChecklists(user.companyId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link
          href="/app"
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Voltar para painel
        </Link>
        <PageHeader
          title="Checklists"
          description="Modelos de inspeção reutilizáveis para ativos."
          action={
            <Link href="/app/checklists/novo" className="inline-flex items-center gap-2">
              <Plus aria-hidden className="size-4" />
              Novo checklist
            </Link>
          }
        />
      </div>

      {checklists.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nenhum checklist cadastrado.</p>
            <Link
              href="/app/checklists/novo"
              className="inline-flex items-center gap-2 mt-4 text-primary hover:underline"
            >
              <Plus aria-hidden className="size-4" />
              Criar o primeiro checklist
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {checklists.map((checklist) => (
            <Card key={checklist.id}>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-lg">{checklist.name}</h3>
                    {checklist.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {checklist.description}
                      </p>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      checklist.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {checklist.isActive ? "Ativo" : "Arquivado"}
                  </span>
                </div>

                {checklist.category && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    {assetCategoryLabels[checklist.category]}
                  </span>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-3">
                  <span>{checklist._count.items} itens</span>
                  <span>{checklist._count.inspections} inspeções</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Link
                    href={`/app/checklists/${checklist.id}`}
                    className="flex-1 text-center text-sm font-medium text-primary hover:underline"
                  >
                    Ver
                  </Link>
                  <Link
                    href={`/app/checklists/${checklist.id}/editar`}
                    className="flex-1 text-center text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    Editar
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}