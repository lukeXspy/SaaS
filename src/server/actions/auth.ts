"use server";

import { AuthError } from "next-auth";

import { loginSchema } from "@/lib/validation/auth";
import { signIn, signOut } from "@/server/auth";
import { safeCallbackUrl } from "@/server/auth/session";

export type LoginState = {
  error?: string;
  email?: string;
};

export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const emailValue = formData.get("email");
  const parsed = loginSchema.safeParse({
    email: emailValue,
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      email: typeof emailValue === "string" ? emailValue : undefined,
    };
  }

  const callbackUrl = safeCallbackUrl(formData.get("callbackUrl"));

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: callbackUrl,
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error:
          error.type === "CredentialsSignin"
            ? "E-mail ou senha inválidos."
            : "Não foi possível entrar. Tente novamente.",
        email: parsed.data.email,
      };
    }
    throw error;
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
