export const runtime = "nodejs";

/**
 * Logout via Route Handler — limpa a sessão httpOnly diretamente.
 *
 * No Netlify, `signOut()` dentro de uma Server Action não envia o header
 * `Set-Cookie` — a sessão persiste mesmo após "logout". Route Handlers
 * retornam Response com headers completos, então o cookie é limpo corretamente.
 *
 * Limpa todas as variações do cookie de sessão do Auth.js v5:
 * - `__Secure-authjs.session-token` (produção, HTTPS)
 * - `authjs.session-token` (desenvolvimento)
 * - `next-auth.session-token` (compatibilidade)
 */
export async function GET() {
  const expired = "Thu, 01 Jan 1970 00:00:00 GMT";

  const response = new Response(null, {
    status: 302,
    headers: {
      Location: "/login",
    },
  });

  // Produção (HTTPS) — cookie com prefixo __Secure-
  response.headers.append(
    "Set-Cookie",
    `__Secure-authjs.session-token=; Path=/; Expires=${expired}; HttpOnly; Secure; SameSite=Lax`,
  );

  // Desenvolvimento (HTTP)
  response.headers.append(
    "Set-Cookie",
    `authjs.session-token=; Path=/; Expires=${expired}; HttpOnly; SameSite=Lax`,
  );

  // Compatibilidade com next-auth v4
  response.headers.append(
    "Set-Cookie",
    `__Secure-next-auth.session-token=; Path=/; Expires=${expired}; HttpOnly; Secure; SameSite=Lax`,
  );
  response.headers.append(
    "Set-Cookie",
    `next-auth.session-token=; Path=/; Expires=${expired}; HttpOnly; SameSite=Lax`,
  );

  // Cookies auxiliares
  response.headers.append(
    "Set-Cookie",
    `authjs.callback-url=; Path=/; Expires=${expired}; SameSite=Lax`,
  );
  response.headers.append(
    "Set-Cookie",
    `authjs.csrf-token=; Path=/; Expires=${expired}; HttpOnly; SameSite=Lax`,
  );

  return response;
}
