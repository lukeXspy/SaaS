import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/server/auth/session";
import { ChecklistForm } from "./checklist-form";

export const metadata: Metadata = {
  title: "Novo checklist",
};

export default async function NewChecklistPage() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/app/checklists"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Voltar para checklists
      </Link>

      <PageHeader title="Novo checklist" description="Crie um modelo de inspeção reutilizável." />

      <Card>
        <CardContent>
          <ChecklistForm />
        </CardContent>
      </Card>
    </div>
  );
}