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
    <div className="relative flex min-h-dvh flex-col bg-slate-950">
      {/* Cinematic background */}
      <div
        aria-hidden
        className="bg-dots pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_80%_60%_at_50%_30%,black,transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_0%,rgba(245,158,11,0.06),transparent)]"
      />

      <main className="relative mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-12">
        <Link
          href="/"
          className="cinematic-in mb-10 inline-flex items-center gap-3 text-xl font-semibold tracking-tight text-slate-100"
        >
          <span
            aria-hidden
            className="flex size-10 items-center justify-center rounded-xl bg-amber-500 text-base font-bold text-slate-950 shadow-lg shadow-amber-500/20"
          >
            M
          </span>
          Manutenza
        </Link>

        <div className="cinematic-in-1">
          <Card className="border-white/10 bg-slate-900/70 shadow-2xl shadow-black/40 backdrop-blur-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl tracking-tight text-slate-100">
                Acessar o sistema
              </CardTitle>
              <CardDescription className="leading-relaxed text-slate-400">
                Use o e-mail e a senha cadastrados pela sua empresa.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm callbackUrl={callbackUrl} />
            </CardContent>
          </Card>
        </div>

        <p className="cinematic-in-2 mt-8 text-center text-sm text-slate-500">
          Esqueceu a senha?{" "}
          <Link
            href="/esqueci-senha"
            className="font-medium text-slate-300 underline-offset-4 hover:text-white hover:underline"
          >
            Redefinir acesso
          </Link>
        </p>
      </main>
    </div>
  );
}