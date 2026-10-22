import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { safeCallbackUrl } from "@/server/auth/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-12">
      <Link href="/" className="mb-8 text-lg font-semibold tracking-tight">
        Manutenza
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Acessar o sistema</CardTitle>
          <CardDescription>Use o e-mail e a senha cadastrados pela sua empresa.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm callbackUrl={callbackUrl} />
        </CardContent>
      </Card>
    </main>
  );
}
