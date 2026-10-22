import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getInviteByToken } from "@/server/services/users";
import { roleLabels } from "@/lib/labels";
import { AcceptInviteForm } from "./accept-invite-form";

export const metadata: Metadata = {
  title: "Aceitar convite",
};

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await getInviteByToken(token);

  if (!invite) notFound();

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-12">
      <Link href="/login" className="mb-8 text-lg font-semibold tracking-tight">
        Manutenza
      </Link>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Você foi convidado!</CardTitle>
          <CardDescription>
            Cadastre sua senha para acessar o Manutenza como{" "}
            {roleLabels[invite.role].toLowerCase()}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AcceptInviteForm token={token} email={invite.email} />
        </CardContent>
      </Card>
    </main>
  );
}