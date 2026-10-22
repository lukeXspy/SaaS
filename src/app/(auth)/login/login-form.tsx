"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, type LoginState } from "@/server/actions/auth";

const initialState: LoginState = {};

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus
          required
          maxLength={254}
          defaultValue={state.email}
          placeholder="voce@empresa.com.br"
          aria-invalid={Boolean(state.error)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={72}
          aria-invalid={Boolean(state.error)}
        />
      </div>

      {state.error ? (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? <Loader2 aria-hidden className="animate-spin" /> : null}
        {pending ? "Entrando…" : "Entrar"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Esqueceu a senha?{" "}
        <Link href="/esqueci-senha" className="font-medium text-foreground underline-offset-4 hover:underline">
          Redefinir acesso
        </Link>
      </p>
    </form>
  );
}
