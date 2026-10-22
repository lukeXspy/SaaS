import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/server/auth/session";
import { prisma } from "@/server/db/client";
import { ProfileForm } from "./profile-form";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = {
  title: "Minha conta",
};

export default async function AccountSettingsPage() {
  const sessionUser = await requireUser();

  // Busca dados completos (incluindo phone) direto do banco
  const user = await prisma.user.findFirst({
    where: { id: sessionUser.id, isActive: true },
    select: { name: true, email: true, phone: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/app"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Voltar para painel
      </Link>

      <PageHeader title="Minha conta" description="Atualize seus dados e senha." />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados pessoais</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm
              user={{
                name: user?.name ?? sessionUser.name,
                email: user?.email ?? sessionUser.email,
                phone: user?.phone ?? null,
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Alterar senha</CardTitle>
          </CardHeader>
          <CardContent>
            <PasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}