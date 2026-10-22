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
          <CardTitle className="text-2xl">Redefinir acesso</CardTitle>
          <CardDescription>
            Em breve você poderá solicitar um link de redefinição por aqui. Por enquanto, peça ao
            administrador da sua empresa para gerar um novo link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login" className="text-sm font-medium underline-offset-4 hover:underline">
            Voltar para o login
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
