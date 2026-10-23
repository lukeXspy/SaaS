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
    <div className="relative flex min-h-dvh flex-col">
      {/* Background: dots com fade */}
      <div
        aria-hidden
        className="bg-dots pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_80%_70%_at_50%_40%,black,transparent)]"
      />

      <main className="relative mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-12">
        <Link
          href="/"
          className="animate-fade-up mb-8 inline-flex items-center gap-2 text-lg font-semibold tracking-tight"
        >
          <span
            aria-hidden
            className="inline-flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
          >
            M
          </span>
          Manutenza
        </Link>

        <div className="animate-fade-up-1">
          <Card className="border-border/60 shadow-lg shadow-black/[0.03]">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl tracking-tight">Acessar o sistema</CardTitle>
              <CardDescription className="leading-relaxed">
                Use o e-mail e a senha cadastrados pela sua empresa.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm callbackUrl={callbackUrl} />
            </CardContent>
          </Card>
        </div>

        <p className="animate-fade-up-2 mt-6 text-center text-sm text-muted-foreground">
          Esqueceu a senha?{" "}
          <Link
            href="/esqueci-senha"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Redefinir acesso
          </Link>
        </p>
      </main>
    </div>
  );
}