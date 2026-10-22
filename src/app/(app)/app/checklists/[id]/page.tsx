import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/server/auth/session";
import { getChecklistTemplate } from "@/server/services/checklists";
import { assetCategoryLabels, checklistItemTypeLabels } from "@/lib/labels";
import { ChecklistItemForm } from "./checklist-item-form";
import { DeleteItemButton } from "./delete-item-button";

export const metadata: Metadata = {
  title: "Detalhe do checklist",
};

export default async function ChecklistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  const { id } = await params;
  const checklist = await getChecklistTemplate(user.companyId, id);

  if (!checklist) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/app/checklists"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Voltar para checklists
      </Link>

      <PageHeader
        title={checklist.name}
        description={checklist.description ?? undefined}
        action={
          <Link href={`/app/checklists/${checklist.id}/editar`} className="text-sm font-medium text-primary hover:underline">
            Editar checklist
          </Link>
        }
      />

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-lg">{checklist.name}</CardTitle>
            {checklist.category && (
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                {assetCategoryLabels[checklist.category]}
              </span>
            )}
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                checklist.isActive ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800"
              }`}
            >
              {checklist.isActive ? "Ativo" : "Arquivado"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {checklist.items.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum item cadastrado.</p>
          ) : (
            <ul className="space-y-3">
              {checklist.items.map((item, idx) => (
                <li
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30"
                >
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{item.label}</p>
                    {item.helpText && <p className="text-sm text-muted-foreground mt-0.5">{item.helpText}</p>}
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-0.5">
                        {checklistItemTypeLabels[item.type]}
                      </span>
                      {item.required && <span className="text-red-600">Obrigatório</span>}
                      {item.requiresPhotoOnFail && <span className="text-amber-600">Foto na falha</span>}
                      {item.unit && <span>{item.unit}</span>}
                      {item.type === "NUMBER" &&
                        (item.minValue !== null || item.maxValue !== null) && (
                          <span>
                            {item.minValue !== null ? `≥ ${item.minValue}` : ""}
                            {item.minValue !== null && item.maxValue !== null ? " – " : ""}
                            {item.maxValue !== null ? `≤ ${item.maxValue}` : ""}
                          </span>
                        )}
                    </div>
                  </div>
                  <DeleteItemButton templateId={checklist.id} itemId={item.id} />
                </li>
              ))}
            </ul>
          )}

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Adicionar item</h4>
            <ChecklistItemForm templateId={checklist.id} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}