import type { NextAuthConfig } from "next-auth";

/**
 * Configuração compartilhada entre o runtime da aplicação e o proxy (Next 16).
 * Não importa Prisma nem bcrypt: o proxy só precisa decodificar o JWT.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
  },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub ?? "";
      return session;
    },
  },
} satisfies NextAuthConfig;
