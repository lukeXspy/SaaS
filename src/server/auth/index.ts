import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { loginSchema } from "@/lib/validation/auth";
import { prisma } from "@/server/db/client";
import { authConfig } from "./config";

// Hash descartável usado para manter o tempo de resposta constante quando
// o e-mail não existe (evita enumeração de usuários por timing).
const DUMMY_HASH = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credenciais",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findFirst({
          where: { email, isActive: true },
          select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
          },
        });

        const valid = await compare(password, user?.passwordHash ?? DUMMY_HASH);
        if (!user || !valid) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
});
