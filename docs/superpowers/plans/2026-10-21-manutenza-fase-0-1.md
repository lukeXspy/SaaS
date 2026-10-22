# Manutenza — Fase 0 + 1 (Fundação e Auth multi-tenant) — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar o app rodando com login, convite, papéis e isolamento por empresa, pronto para receber os cadastros da Fase 2.

**Architecture:** Next.js App Router com Server Actions; Auth.js v5 (Credentials + JWT) dividido em config edge-safe e config Node; Prisma com `companyId` em todo modelo de negócio e uma extensão que rejeita consultas sem escopo de tenant. Sem e-mail transacional: convite e reset geram link copiável.

**Tech Stack:** Next.js (App Router, TypeScript strict), Tailwind + shadcn/ui, Prisma + PostgreSQL (Supabase Free), Auth.js v5, Zod, bcryptjs, Vitest, npm.

**Spec:** `docs/specs/manutenza/design.md` (e `data-model.md`, `routes-and-api.md`, `permissions.md`)

## Global Constraints

- Orçamento **R$ 0**: Supabase Free, Netlify Free (produção), GitHub Actions, npm. Nenhuma dependência paga.
- TypeScript `strict` + `noUncheckedIndexedAccess` + `noImplicitOverride`.
- Todo input externo validado com Zod; nenhuma action aceita `companyId` do cliente.
- Acesso a recurso de outra empresa retorna **404**, nunca 403.
- Mensagens de UI em **pt-BR**; enums em inglês com rótulos em `src/lib/labels.ts`.
- Arquivo de código ≤ ~300 linhas.
- Sem `any` implícito; sem `@ts-ignore`.
- Datas em UTC no banco; exibição em `America/Sao_Paulo`.
- Nenhum delete físico de entidade de negócio.
- Segredos só em `.env.local`; `.env.example` documenta as chaves.

## Review Focus

- Login com usuário inativo ou sem senha definida (convite não aceito) deve ser negado com a mesma mensagem genérica de credenciais inválidas.
- Consulta a modelo de tenant sem `companyId` (ex.: `findUnique({ where: { id } })`) deve lançar erro em vez de retornar dado de outra empresa.
- Convite expirado, já aceito ou com token adulterado deve ser recusado sem revelar o e-mail associado.
- Transições de status inválidas (`DONE → OPEN`, `CANCELED → qualquer`, técnico cancelando) devem ser recusadas no service, não só escondidas na UI.
- `AUTH_SECRET` ausente ou curto deve impedir o boot com mensagem clara, não falhar em runtime no primeiro login.

---

### Task 1: Scaffold Next.js com TypeScript estrito

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `.prettierrc`, `.gitignore`, `src/app/{layout.tsx,page.tsx,globals.css}`
- Test: verificação de build (sem teste unitário ainda)

**Interfaces:**
- Produces: scripts `dev`, `build`, `start`, `lint`, `typecheck`, `test`; alias `@/*` → `src/*`.

- [ ] **Step 1: Criar o app na raiz existente**

Run: `npx --yes create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes`
Expected: projeto criado preservando `docs/`; `npm run dev` sobe em `http://localhost:3000`.

- [ ] **Step 2: Configurar `tsconfig.json`**

Adicionar em `compilerOptions`: `"strict": true`, `"noUncheckedIndexedAccess": true`, `"noImplicitOverride": true`, `"noFallthroughCasesInSwitch": true`.

- [ ] **Step 3: Adicionar scripts e Prettier**

Em `package.json`: `"typecheck": "tsc --noEmit"`, `"test": "vitest run"`, `"test:watch": "vitest"`, `"db:generate": "prisma generate"`, `"db:migrate": "prisma migrate dev"`, `"db:seed": "prisma db seed"`.
Criar `.prettierrc` com `{ "semi": true, "singleQuote": false, "printWidth": 100 }` e `.prettierignore`.

- [ ] **Step 4: Verificar**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: os três passam sem erro.

- [ ] **Step 5: Commit**

```bash
git init
git add .
git commit -m "chore: scaffold next.js app with strict typescript"
```

---

### Task 2: Tokens visuais, shadcn e rótulos pt-BR

**Files:**
- Create: `components.json`, `src/components/ui/*` (gerados), `src/lib/labels.ts`, `src/lib/utils.ts` (gerado)
- Modify: `src/app/globals.css`, `src/app/layout.tsx`
- Test: `tests/unit/labels.test.ts`

**Interfaces:**
- Produces: `labels` (objeto com mapas `workOrderStatus`, `workOrderType`, `workOrderPriority`, `assetCategory`, `assetStatus`, `criticality`, `inspectionStatus`, `inspectionResult`, `userRole`, `checklistItemType`), cada um `Record<Enum, string>`; `formatLabel(kind, value)`.

- [ ] **Step 1: Inicializar shadcn e componentes base**

Run: `npx shadcn@latest init -d` e depois `npx shadcn@latest add button input label card badge select textarea dialog sheet sonner`
Expected: `src/components/ui` populado, `components.json` criado.

- [ ] **Step 2: Escrever o teste de rótulos (falhando)**

```ts
// tests/unit/labels.test.ts
import { describe, expect, it } from "vitest";
import { labels } from "@/lib/labels";

describe("labels pt-BR", () => {
  it("cobre todos os status de OS", () => {
    expect(labels.workOrderStatus).toEqual({
      OPEN: "Aberta",
      IN_PROGRESS: "Em andamento",
      WAITING_PARTS: "Aguardando peça",
      DONE: "Concluída",
      CANCELED: "Cancelada",
    });
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npm test -- labels`
Expected: FAIL — módulo `@/lib/labels` não existe.

- [ ] **Step 4: Implementar `src/lib/labels.ts`**

Exportar `labels` com os 10 mapas, todos os valores em pt-BR (ex.: `TECHNICIAN: "Técnico"`, `NOT_OK: "Não OK"`, `CANCELED: "Cancelada"`). Exportar `formatLabel`.

- [ ] **Step 5: Aplicar tokens e rodar**

Definir em `globals.css` cor primária azul-petróleo, raio 0.5rem, e `--touch-target: 44px`; aplicar `font-sans` no `body`. Rodar `npm test -- labels` e `npm run build`.
Expected: PASS e build verde.

- [ ] **Step 6: Commit**

```bash
git add . && git commit -m "feat: add design tokens and pt-br labels"
```

---

### Task 3: Validação de ambiente e health check

**Files:**
- Create: `src/lib/env.ts`, `src/app/api/health/route.ts`
- Test: `tests/unit/env.test.ts`
- Modify: `.env.example`

**Interfaces:**
- Produces: `env` (objeto tipado), `EnvSchema` (Zod). Variáveis: `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET` (min 32), `AUTH_URL`, `AUTH_TRUST_HOST`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`, `NEXT_PUBLIC_SUPABASE_URL`.

- [ ] **Step 1: Escrever o teste**

```ts
// tests/unit/env.test.ts
import { describe, expect, it } from "vitest";
import { EnvSchema } from "@/lib/env";

const base = {
  DATABASE_URL: "postgresql://u:p@h:6543/db",
  DIRECT_URL: "postgresql://u:p@h:5432/db",
  AUTH_SECRET: "x".repeat(32),
  AUTH_URL: "http://localhost:3000",
  AUTH_TRUST_HOST: "true",
  SUPABASE_URL: "https://x.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "k",
  SUPABASE_STORAGE_BUCKET: "manutenza",
  NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
};

describe("EnvSchema", () => {
  it("aceita config válida", () => expect(EnvSchema.parse(base)).toBeTruthy());
  it("rejeita AUTH_SECRET curto", () => {
    expect(() => EnvSchema.parse({ ...base, AUTH_SECRET: "curto" })).toThrow();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar** — `npm test -- env` → FAIL (módulo ausente).

- [ ] **Step 3: Implementar `src/lib/env.ts`**

`EnvSchema = z.object({...})` com `AUTH_TRUST_HOST: z.coerce.boolean().default(true)`; `export const env = EnvSchema.parse(process.env)` importado apenas no servidor. Criar `.env.example` com todas as chaves e comentários.

- [ ] **Step 4: Implementar `/api/health`**

`GET` retorna `{ status: "ok", version: process.env.npm_package_version ?? "dev", db: "skipped" }` com `export const runtime = "nodejs"`. Não consulta o banco ainda (evita falhar sem DB).

- [ ] **Step 5: Verificar** — `npm test -- env && npm run build`.

- [ ] **Step 6: Commit** — `git commit -m "feat: validate environment and add health endpoint"`.

---

### Task 4: Schema Prisma completo e client

**Files:**
- Create: `prisma/schema.prisma` (conteúdo de `docs/specs/manutenza/data-model.md`), `src/server/db/client.ts`
- Modify: `package.json` (`prisma.seed`), `.gitignore`
- Test: `npx prisma validate` e `npx prisma generate`

**Interfaces:**
- Produces: `prisma` (PrismaClient base, uso restrito a seed/migração/scripts), tipos gerados (`WorkOrderStatus`, `UserRole`, etc.).

- [ ] **Step 1: Instalar e inicializar**

Run: `npm i -D prisma && npm i @prisma/client && npx prisma init --datasource-provider postgresql`
Expected: `prisma/schema.prisma` criado.

- [ ] **Step 2: Colar o schema completo**

Copiar o bloco Prisma de `docs/specs/manutenza/data-model.md`. **Alterar** `Invite.token` para `tokenHash String @unique` (guardar só o hash do token).

- [ ] **Step 3: Validar**

Run: `npx prisma validate && npx prisma generate`
Expected: `The schema at prisma/schema.prisma is valid`.

- [ ] **Step 4: Criar o singleton**

```ts
// src/server/db/client.ts
import { PrismaClient } from "@prisma/client";
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 5: Configurar seed e commitar**

`package.json`: `"prisma": { "seed": "tsx prisma/seed.ts" }`; `npm i -D tsx`.
Commit: `feat: add multi-tenant prisma schema`.

> Migração real só depois de existir `DIRECT_URL` (Task 10). Até lá, `prisma generate` basta.

---

### Task 5: Harness de testes e máquina de estados da OS

**Files:**
- Create: `vitest.config.ts`, `tests/setup.ts`, `src/server/services/work-orders/work-order-status.ts`
- Test: `tests/unit/work-order-status.test.ts`, `tests/unit/permissions.test.ts`

**Interfaces:**
- Produces: `canTransition(current: WorkOrderStatus, next: WorkOrderStatus, role: UserRole): boolean`; `assertTransition(...)` que lança `AppError("CONFLICT", ...)`.

- [ ] **Step 1: Configurar Vitest**

`npm i -D vitest @vitest/coverage-v8 vite-tsconfig-paths`; `vitest.config.ts` com `plugins: [tsconfigPaths()]`, `test.environment: "node"`, `setupFiles: ["./tests/setup.ts"]`; script `test` já existe.

- [ ] **Step 2: Escrever os testes (falhando)**

```ts
// tests/unit/work-order-status.test.ts
import { describe, expect, it } from "vitest";
import { canTransition } from "@/server/services/work-orders/work-order-status";

describe("canTransition", () => {
  it("admin pode reabrir concluída", () => expect(canTransition("DONE", "OPEN", "ADMIN")).toBe(true));
  it("técnico não pode reabrir", () => expect(canTransition("DONE", "OPEN", "TECHNICIAN")).toBe(false));
  it("técnico não pode cancelar", () => expect(canTransition("OPEN", "CANCELED", "TECHNICIAN")).toBe(false));
  it("aguardando peça volta para andamento", () =>
    expect(canTransition("WAITING_PARTS", "IN_PROGRESS", "TECHNICIAN")).toBe(true));
  it("cancelada é terminal", () => expect(canTransition("CANCELED", "OPEN", "ADMIN")).toBe(false));
});
```

- [ ] **Step 3: Rodar e ver falhar** — `npm test -- work-order-status` → FAIL.

- [ ] **Step 4: Implementar**

Mapa `TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]>`:
`OPEN → [IN_PROGRESS, CANCELED]`, `IN_PROGRESS → [WAITING_PARTS, DONE, CANCELED]`, `WAITING_PARTS → [IN_PROGRESS, CANCELED]`, `DONE → [OPEN]` (só ADMIN), `CANCELED → []`.
Regra de papel: `TECHNICIAN` não pode `CANCELED` nem sair de `DONE`. `canTransition` retorna booleano; `assertTransition` lança `AppError` com mensagem `"Transição de status não permitida."`.

- [ ] **Step 5: Verificar e commitar** — `npm test` verde; `git commit -m "feat: add work order state machine"`.

---

### Task 6: Núcleo de autenticação (senha, Auth.js, tipos)

**Files:**
- Create: `src/server/auth/password.ts`, `src/server/auth/auth.config.ts`, `src/server/auth/auth.ts`, `src/types/next-auth.d.ts`, `src/lib/errors.ts`
- Test: `tests/unit/password.test.ts`

**Interfaces:**
- Produces: `hashPassword(plain: string): Promise<string>`, `verifyPassword(plain: string, hash: string): Promise<boolean>`; `authConfig` (edge-safe); `handlers`, `auth`, `signIn`, `signOut`; augmentação de `Session.user` com `id`, `companyId`, `role`.

- [ ] **Step 1: Instalar** — `npm i next-auth@beta bcryptjs && npm i -D @types/bcryptjs`.

- [ ] **Step 2: Teste de senha (falhando)**

```ts
// tests/unit/password.test.ts
import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/server/auth/password";

describe("password", () => {
  it("gera hash verificável e diferente do texto", async () => {
    const hash = await hashPassword("SenhaForte123");
    expect(hash).not.toBe("SenhaForte123");
    expect(await verifyPassword("SenhaForte123", hash)).toBe(true);
  });
  it("rejeita senha errada", async () => {
    const hash = await hashPassword("SenhaForte123");
    expect(await verifyPassword("errada", hash)).toBe(false);
  });
});
```

- [ ] **Step 3: Implementar `password.ts`** com `bcryptjs`, `SALT_ROUNDS = 12`.

- [ ] **Step 4: Criar `AppError` e `Result`**

```ts
export type ErrorCode = "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "VALIDATION" | "CONFLICT";
export class AppError extends Error {
  constructor(public code: ErrorCode, message: string, public fieldErrors?: Record<string, string[]>) { super(message); }
}
export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; code: ErrorCode; message: string; fieldErrors?: Record<string, string[]> };
```

- [ ] **Step 5: Configurar Auth.js em dois arquivos**

`auth.config.ts`: `pages.signIn = "/login"`, `session.strategy = "jwt"`, `providers: []`, callbacks `jwt` (copia `companyId`, `role` do `user` no login) e `session` (expõe `id`, `companyId`, `role`). `auth.ts`: `NextAuth({ ...authConfig, providers: [Credentials({...})] })`; `authorize` busca usuário por e-mail com `prisma`, exige `isActive` e `passwordHash`, compara senha e retorna `{ id, name, email, companyId, role }`.

- [ ] **Step 6: Verificar** — `npm test -- password && npm run typecheck`.

- [ ] **Step 7: Commit** — `feat: add auth.js credentials core`.

---

### Task 7: Tenant context, guards e extensão Prisma

**Files:**
- Create: `src/server/db/tenant-extension.ts`, `src/server/auth/session.ts`, `src/server/auth/guards.ts`, `src/server/permissions/matrix.ts`, `src/server/permissions/can.ts`
- Test: `tests/unit/tenant-guard.test.ts`, `tests/unit/permissions.test.ts`

**Interfaces:**
- Produces: `TENANT_MODELS: ReadonlySet<string>`; `assertTenantScoped(model: string | undefined, operation: string, args: Record<string, unknown>): void`; `db` (client estendido); `getTenantContext(): Promise<TenantContext>`; `requireSession()`; `requireRole(role: UserRole)`; `can(role, action, resource)`; `TenantContext = { userId: string; companyId: string; role: UserRole }`.

- [ ] **Step 1: Teste do guard (falhando)**

```ts
import { describe, expect, it } from "vitest";
import { assertTenantScoped } from "@/server/db/tenant-extension";

describe("assertTenantScoped", () => {
  it("rejeita findMany sem companyId", () => {
    expect(() => assertTenantScoped("WorkOrder", "findMany", { where: {} })).toThrow(/companyId/);
  });
  it("aceita findMany com companyId", () => {
    expect(() => assertTenantScoped("WorkOrder", "findMany", { where: { companyId: "c1" } })).not.toThrow();
  });
  it("ignora modelos não-tenant", () => {
    expect(() => assertTenantScoped("Company", "findMany", { where: {} })).not.toThrow();
  });
  it("exige companyId no create", () => {
    expect(() => assertTenantScoped("Asset", "create", { data: {} })).toThrow(/companyId/);
  });
});
```

- [ ] **Step 2: Implementar a regra**

`TENANT_MODELS` = User, Client, Site, Asset, ChecklistTemplate, ChecklistTemplateItem, WorkOrder, WorkOrderStatusHistory, WorkOrderExecution, WorkOrderItem, Inspection, InspectionResponse, Attachment, Invite.
Leitura/escrita: exigir `args.where.companyId` (string) para `findFirst/findMany/update/updateMany/delete/deleteMany/count/aggregate/groupBy`; **proibir `findUnique`** em modelo de tenant (mensagem: use `findFirst` com `companyId`).
Create/createMany: exigir `args.data.companyId`.
`upsert`: exigir `where.companyId` e `create.companyId`.

- [ ] **Step 3: Criar o client estendido**

```ts
export const db = prisma.$extends({
  query: { $allModels: { async $allOperations({ model, operation, args, query }) {
    assertTenantScoped(model, operation, args as Record<string, unknown>);
    return query(args);
  } } },
});
```

- [ ] **Step 4: Guards**

`getTenantContext()` lê `auth()`, lança `AppError("UNAUTHORIZED")` sem sessão; valida `companyId` e `role` presentes. `requireSession()` redireciona para `/login` em páginas (usa `redirect` de `next/navigation`). `requireRole` lança `AppError("NOT_FOUND")` para técnico em tela de admin.

- [ ] **Step 5: Matriz de permissões**

`can(role, action, resource)` cobrindo a matriz de `permissions.md`: actions `read`, `create`, `update`, `delete`, `execute`, `cancel`, `assign`. Testar 6 casos críticos (técnico não cancela, técnico lê OS própria, admin lê tudo, técnico não cria ativo, admin cria ativo, técnico não gere equipe).

- [ ] **Step 6: Verificar e commitar** — `npm test` verde; `git commit -m "feat: enforce tenant scoping and permissions"`.

---

### Task 8: Login, logout, middleware e redirecionamento por papel

**Files:**
- Create: `src/middleware.ts`, `src/server/actions/auth.actions.ts`, `src/app/(auth)/layout.tsx`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/login/login-form.tsx`
- Modify: `src/app/page.tsx`
- Test: `npm run build` + verificação manual

**Interfaces:**
- Produces: `loginAction(_: ActionResult | null, formData: FormData): Promise<ActionResult>`, `logoutAction(): Promise<void>`.

- [ ] **Step 1: Middleware edge-safe**

```ts
import NextAuth from "next-auth";
import { authConfig } from "@/server/auth/auth.config";
export const { auth: middleware } = NextAuth(authConfig);
export const config = { matcher: ["/dashboard/:path*", "/ordens/:path*", "/clientes/:path*", "/locais/:path*", "/ativos/:path*", "/inspecoes/:path*", "/checklists/:path*", "/tecnicos/:path*", "/configuracoes/:path*", "/campo/:path*"] };
```
Redirecionar para `/login?callbackUrl=...` quando não houver sessão.

- [ ] **Step 2: Página e formulário de login**

`login/page.tsx` (server) renderiza `LoginForm` (client, `useActionState`). Campos e-mail/senha, erro genérico `"E-mail ou senha inválidos."`, botão com estado pendente.

- [ ] **Step 3: Action**

Zod `loginSchema` (`email`, `password` 8–72). Chama `signIn("credentials", { email, password, redirect: false })`; em erro retorna `ActionResult` genérico; em sucesso `redirect(role === "ADMIN" ? "/dashboard" : "/campo")`.

- [ ] **Step 4: Raiz e logout**

`src/app/page.tsx`: sessão → redireciona por papel; sem sessão → `/login`. `logoutAction` chama `signOut({ redirectTo: "/login" })`.

- [ ] **Step 5: Verificar**

`npm run build`. Manual: `/dashboard` sem sessão → `/login`; login inválido → mensagem genérica.

- [ ] **Step 6: Commit** — `feat: add login, logout and role redirects`.

---

### Task 9: Convite, aceite e link de redefinição (sem e-mail)

**Files:**
- Create: `src/server/services/users/invite.service.ts`, `src/server/validators/user.ts`, `src/app/(auth)/convite/[token]/page.tsx`, `src/app/(auth)/convite/[token]/accept-form.tsx`, `src/app/(app)/tecnicos/page.tsx`, `src/app/(app)/tecnicos/invite-form.tsx`
- Test: `tests/unit/invite.test.ts`

**Interfaces:**
- Produces: `createInviteToken(): { token: string; tokenHash: string; expiresAt: Date }`; `hashToken(token: string): string`; `acceptInviteSchema`; `createInviteAction`, `acceptInviteAction`, `createResetLinkAction`.

- [ ] **Step 1: Teste do token (falhando)**

```ts
import { describe, expect, it } from "vitest";
import { createInviteToken, hashToken } from "@/server/services/users/invite.service";

describe("invite token", () => {
  it("gera token opaco e hash estável", () => {
    const { token, tokenHash } = createInviteToken();
    expect(token.length).toBeGreaterThan(20);
    expect(hashToken(token)).toBe(tokenHash);
    expect(tokenHash).not.toContain(token);
  });
});
```

- [ ] **Step 2: Implementar** com `crypto.randomBytes(32).toString("base64url")` e `sha256`, validade de 7 dias.

- [ ] **Step 3: Aceite do convite**

Página valida token por hash, `acceptedAt = null`, `expiresAt > now`. Formulário pede nome + senha (mín. 8, 1 letra + 1 número). Action cria/atualiza `User` com `passwordHash`, marca `acceptedAt`, faz login e redireciona para `/campo`.

- [ ] **Step 4: Tela de equipe mínima**

`/tecnicos` (ADMIN): lista usuários + convites pendentes; formulário e-mail/papel; após criar, exibe **link copiável** `${AUTH_URL}/convite/{token}` com botão "Copiar link". Aviso: "Envie este link por WhatsApp. Ele expira em 7 dias."

- [ ] **Step 5: Reset sem e-mail**

Em `/tecnicos/[id]`, ação gera `PasswordResetToken` e exibe link copiável `/redefinir-senha/{token}`. Página `/esqueci-senha` apenas orienta: "Peça ao gestor da sua empresa um link de redefinição."

- [ ] **Step 6: Verificar e commitar** — `npm test && npm run build`; commit `feat: add invite and password reset links`.

---

### Task 10: Seed, migração e testes de isolamento

**Files:**
- Create: `prisma/seed.ts`, `tests/integration/tenant-isolation.test.ts`, `tests/integration/helpers/db.ts`
- Modify: `.env.local` (não versionado)

**Interfaces:**
- Consumes: `db`, `prisma`, serviços da Task 7.
- Produces: empresas `demo-a` e `demo-b` com admin/técnico cada; helper `resetDatabase()`.

- [ ] **Step 1: Criar projeto Supabase Free**

Manual (5 min): criar projeto em `sa-east-1`, copiar `DATABASE_URL` (pooler, 6543) e `DIRECT_URL` (5432) para `.env.local`, criar bucket privado `manutenza`.

- [ ] **Step 2: Migrar**

Run: `npx prisma migrate dev --name init`
Expected: migration criada e aplicada; `npx prisma studio` mostra as tabelas.

- [ ] **Step 3: Seed**

Cria 2 empresas, 2 admins (`admin@a.test`, `admin@b.test`), 2 técnicos, com senha `Senha1234` (hash bcrypt). Imprime os e-mails no console.

- [ ] **Step 4: Teste de isolamento (falhando antes do service)**

```ts
it("empresa A não lê OS da empresa B", async () => {
  const ctxA = { companyId: companyA.id, userId: adminA.id, role: "ADMIN" as const };
  const woB = await db.workOrder.create({ data: { companyId: companyB.id, ...fixture } });
  await expect(getWorkOrder(ctxA, woB.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
});
```

- [ ] **Step 5: Implementar `getWorkOrder(ctx, id)`**

`db.workOrder.findFirst({ where: { id, companyId: ctx.companyId } })`; se null, `throw new AppError("NOT_FOUND", "Ordem de serviço não encontrada.")`.

- [ ] **Step 6: Rodar** — `DATABASE_URL=$TEST_DATABASE_URL npm test` (schema de teste `?schema=manutenza_test`) e `npm run build`.

- [ ] **Step 7: Commit** — `feat: add seed and tenant isolation tests`.

---

### Task 11: CI, deploy e runbook

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/workflows/keepalive.yml`, `netlify.toml`, `docs/runbooks/deploy.md`
- Modify: `README.md`

**Interfaces:**
- Produces: pipeline `lint → typecheck → test → build`; ping semanal do Supabase.

- [ ] **Step 1: CI**

Workflow em `push`/`pull_request`: setup Node 24, `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. Cache do npm.

- [ ] **Step 2: Keepalive**

Cron semanal (`0 6 * * 1`) executando `psql "$DIRECT_URL" -c "select 1"` via `supabase` CLI ou `curl` no endpoint REST com `apikey` — escolher o mais simples e documentar o secret.

- [ ] **Step 3: Netlify**

`netlify.toml` com `[build] command = "npm run build"`, `publish = ".next"`, plugin oficial `@netlify/plugin-nextjs`. Documentar env vars no runbook.

- [ ] **Step 4: Runbook**

Passos: criar Supabase, rodar migrations, criar empresa/admin (script), deploy Netlify, configurar `AUTH_URL`, testar login, gerar convite, backup semanal.

- [ ] **Step 5: Verificar e commitar** — CI verde no GitHub; deploy de preview acessível; commit `chore: add ci and deploy runbook`.

---

## Critério de conclusão da fase

- [ ] `npm run lint && npm run typecheck && npm test && npm run build` verdes.
- [ ] Admin da empresa A loga e cai em `/dashboard`; técnico cai em `/campo`.
- [ ] Técnico da A recebendo ID de OS da B recebe 404 (teste automatizado).
- [ ] Convite expirado e token adulterado recusados (teste automatizado).
- [ ] Nenhuma rota privada acessível sem sessão.
- [ ] CI verde e preview publicado com Supabase conectado.

## Próximo plano

Fase 2 — clientes, locais, ativos e QR, escrito ao final desta fase com os nomes reais já implementados.
