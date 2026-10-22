import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/server/auth/session";
import { getChecklistTemplate } from "@/server/services/checklists";
import { ChecklistEditForm } from "./checklist-edit-form";

export const metadata: Metadata = {
  title: "Editar checklist",
};

export default async function EditChecklistPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  const { id } = await params;
  const checklist = await getChecklistTemplate(user.companyId, id);

  if (!checklist) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/app/checklists/${checklist.id}`}
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Voltar ao checklist
      </Link>

      <PageHeader title="Editar checklist" description="Atualize as informações do modelo de inspeção." />

      <Card>
        <CardContent>
          <ChecklistEditForm checklist={checklist} />
        </CardContent>
      </Card>
    </div>
  );
}