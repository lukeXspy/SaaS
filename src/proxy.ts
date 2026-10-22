import NextAuth from "next-auth";

import { authConfig } from "@/server/auth/config";

const { auth } = NextAuth(authConfig);

/**
 * Next.js 16 substituiu `middleware.ts` por `proxy.ts`.
 * Aqui só há checagem otimista do JWT; a autorização real acontece
 * em cada página/action com `requireUser`/`requireAdmin`.
 */
export default auth((request) => {
  const { pathname } = request.nextUrl;
  const isLoggedIn = Boolean(request.auth?.user);

  const isPrivate =
    pathname.startsWith("/app") ||
    pathname.startsWith("/campo") ||
    pathname.startsWith("/a/") ||
    pathname === "/a";

  if (isPrivate && !isLoggedIn) {
    const url = new URL("/login", request.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return Response.redirect(url);
  }

  if (pathname === "/login" && isLoggedIn) {
    return Response.redirect(new URL("/app", request.nextUrl.origin));
  }

  return;
});

export const config = {
  matcher: ["/app/:path*", "/campo/:path*", "/a/:path*", "/login"],
};
