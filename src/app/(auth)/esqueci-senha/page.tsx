import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Redefinir acesso",
};

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-12">
      <Link href="/login" className="mb-8 text-lg font-semibold tracking-tight">
        Manutenza
      </Link>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Esqueceu a senha?</CardTitle>
          <CardDescription>
            O administrador da sua empresa pode gerar um link de redefinição para você.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <p className="font-medium">O que fazer:</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-muted-foreground">
              <li>
                Peça ao administrador para abrir o menu{" "}
                <strong>Equipe → sua ficha → Gerar link de redefinição</strong>.
              </li>
              <li>Ele copia o link e envia para você via WhatsApp.</li>
              <li>Abra o link e defina sua nova senha.</li>
            </ol>
          </div>
          <Link
            href="/login"
            className="text-sm font-medium underline-offset-4 hover:underline"
          >
            Voltar para o login
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}