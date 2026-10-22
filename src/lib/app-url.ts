const fallbackUrl = "http://localhost:3000";

/** URL pública da aplicação, sem barra final. */
export function getAppUrl(): string {
  const configured = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? fallbackUrl;
  return configured.replace(/\/+$/, "");
}
