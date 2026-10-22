import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { prisma } from "@/server/db/client";
import { auth } from ".";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "TECHNICIAN";
  companyId: string;
  companyName: string;
  companyLogoUrl: string | null;
};

/**
 * Fonte da verdade da sessão: valida o JWT e recarrega o usuário do banco.
 * Assim, desativação e mudança de papel valem imediatamente (sem esperar o JWT expirar).
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const user = await prisma.user.findFirst({
    where: { id: userId, isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      companyId: true,
      company: {
        select: { name: true, logoUrl: true },
      },
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
    companyName: user.company.name,
    companyLogoUrl: user.company.logoUrl,
  };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/app");
  return user;
}

/** Aceita apenas caminhos internos — evita open redirect. */
export function safeCallbackUrl(value: unknown): string {
  if (typeof value !== "string") return "/app";
  if (!value.startsWith("/") || value.startsWith("//")) return "/app";
  return value;
}
