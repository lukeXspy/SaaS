/**
 * Smoke test de autenticação via HTTP (sem navegador).
 * Uso: com `npm run dev` rodando, execute `npx tsx scripts/smoke-auth.ts`.
 */

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      await fetch(`${BASE}/api/health`);
      return;
    } catch {
      await sleep(500);
    }
  }
  throw new Error("Servidor não respondeu a tempo.");
}

function cookiesFrom(response: Response): string[] {
  return response.headers.getSetCookie();
}

function cookieHeader(cookies: string[]): string {
  return cookies.map((cookie) => cookie.split(";")[0]).join("; ");
}

async function getCsrf() {
  const response = await fetch(`${BASE}/api/auth/csrf`);
  const data = (await response.json()) as { csrfToken: string };
  return { token: data.csrfToken, cookies: cookiesFrom(response) };
}

async function login(email: string, password: string) {
  const csrf = await getCsrf();
  const body = new URLSearchParams({
    csrfToken: csrf.token,
    email,
    password,
    callbackUrl: `${BASE}/app`,
  });

  const response = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: cookieHeader(csrf.cookies),
    },
    body,
    redirect: "manual",
  });

  return {
    status: response.status,
    location: response.headers.get("location"),
    cookies: [...csrf.cookies, ...cookiesFrom(response)],
  };
}

async function main() {
  await waitForServer();

  let failures = 0;

  const anonymous = await fetch(`${BASE}/app`, { redirect: "manual" });
  if (anonymous.status !== 302 || !anonymous.headers.get("location")?.includes("/login")) {
    console.error("FALHOU: /app sem sessão deveria redirecionar para /login");
    failures++;
  } else {
    console.log("OK: /app sem sessão redireciona para /login");
  }

  const wrong = await login("admin@a.test", "senha-errada");
  if (wrong.status !== 302 || !wrong.location?.includes("error=CredentialsSignin")) {
    console.error("FALHOU: senha errada deveria retornar CredentialsSignin", wrong.status, wrong.location);
    failures++;
  } else {
    console.log("OK: senha errada é rejeitada");
  }

  for (const [email, label] of [
    ["admin@a.test", "admin"],
    ["tecnico@a.test", "técnico"],
  ] as const) {
    const session = await login(email, "Senha1234");
    if (session.status !== 302 || !session.location?.endsWith("/app")) {
      console.error(`FALHOU: login de ${label}`, session.status, session.location);
      failures++;
      continue;
    }

    const page = await fetch(`${BASE}/app`, {
      headers: { cookie: cookieHeader(session.cookies) },
      redirect: "manual",
    });
    const html = await page.text();

    if (page.status !== 200 || !html.includes("Olá")) {
      console.error(`FALHOU: página /app de ${label}`, page.status);
      failures++;
    } else {
      console.log(`OK: login e sessão de ${label}`);
    }
  }

  if (failures > 0) {
    console.error(`\n${failures} verificação(ões) falharam.`);
    process.exit(1);
  }

  console.log("\nSmoke de autenticação concluído com sucesso.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
