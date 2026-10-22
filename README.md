# Manutenza

SaaS de gestão de manutenção para pequenas empresas (elétrica, refrigeração, climatização,
automação e manutenção predial). Multi-tenant desde o primeiro dia, em português, mobile-first.

## Stack

- **Next.js 16** (App Router, Server Actions, Proxy) + React 19 + TypeScript strict
- **Tailwind CSS 4** + shadcn/ui (base-nova)
- **PostgreSQL** + Prisma ORM
- **Auth.js v5** (Credentials + JWT)
- **Supabase Storage** para fotos/assinaturas (URLs assinadas)
- **React PDF** para relatórios
- **Vitest** para testes

## Rodando localmente (sem Docker e sem custo)

Pré-requisitos: Node.js 24+ e npm.

```bash
npm install

# 1. Sobe um PostgreSQL embarcado na porta 5433 (dados em ./.pgdata)
npm run db:local

# 2. Em outro terminal: aplica migrations e popula dados de demonstração
npm run db:deploy
npm run db:seed

# 3. Sobe a aplicação
npm run dev
```

Acesse http://localhost:3000.

### Credenciais de demonstração

| Perfil  | E-mail           | Senha     |
| ------- | ---------------- | --------- |
| Admin   | `admin@a.test`   | `Senha1234` |
| Técnico | `tecnico@a.test` | `Senha1234` |
| Admin (outra empresa) | `admin@b.test` | `Senha1234` |

A empresa B existe para provar o isolamento entre tenants.

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript strict |
| `npm test` | Vitest (testes unitários) |
| `npm run db:local` | PostgreSQL embarcado (porta 5433) |
| `npm run db:deploy` | Aplica migrations |
| `npm run db:seed` | Popula dados de demonstração |
| `npm run db:studio` | Prisma Studio (GUI do banco) |
| `npm run media:migrate` | Migra fotos/assinaturas para o Supabase Storage |
| `npm run supabase:test` | Testa conexão com o Supabase |

## Deploy no Supabase (produção)

### 1. Criar projeto

1. Acesse [supabase.com](https://supabase.com) → New Project
2. Escolha a região **South America (São Paulo)**
3. Defina a senha do banco
4. Aguarde o provisionamento (pode levar 5-10 min)

### 2. Obter credenciais

```bash
# Testa a conexão (mostra as URLs quando a pooler registrar o projeto)
npm run supabase:test
```

Ou manualmente no dashboard:

| Variável | Onde encontrar |
| --- | --- |
| `DATABASE_URL` | Settings → Database → Connection string (pooling, porta 6543) |
| `DIRECT_URL` | Settings → Database → Connection string (direct, porta 5432) |
| `SUPABASE_URL` | `https://[project-ref].supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → service_role (secret) |

### 3. Criar bucket de Storage

No SQL Editor do Supabase, rode:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('manutenza-media', 'manutenza-media', false)
ON CONFLICT (id) DO NOTHING;
```

### 4. Aplicar migrations e seed

```bash
# No .env, troque DATABASE_URL/DIRECT_URL pelas URLs do Supabase
npm run db:deploy
npm run db:seed
```

### 5. Migrar mídia (opcional — fotos/assinaturas locais → Storage)

```bash
npm run media:migrate
```

### 6. Deploy (Netlify)

1. Conecte o repositório GitHub ao Netlify
2. Configure as variáveis de ambiente (todas do `.env`)
3. Deploy automático a cada push para `main`

## Variáveis de ambiente

Copie `.env.example` para `.env`. Em produção (Supabase), use:

- `DATABASE_URL`: pooler do Supabase, porta **6543**, com `?pgbouncer=true`
- `DIRECT_URL`: conexão direta, porta **5432** (migrations)
- `AUTH_SECRET`: `openssl rand -base64 32`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`

## Isolamento multi-tenant

Três camadas:

1. **Sessão** — `requireUser()` recarrega o usuário do banco e valida `isActive`.
2. **Serviço** — toda query de negócio usa `createTenantClient(companyId)` e filtra por
   `companyId`; registro de outro tenant responde **404**, nunca 403.
3. **Guard Prisma** — extensão rejeita operações sem `companyId` e proíbe `findUnique`,
   `update` e `delete` unitários em modelos de negócio.

O client global `prisma` é reservado para autenticação, convites e health check.

## Estrutura

```
src/
  app/            rotas (App Router) e route handlers
  components/     UI (shadcn) e componentes de domínio
  lib/            regras puras, validação (Zod), rótulos pt-BR
  server/
    actions/      Server Actions (mutações)
    auth/         Auth.js, sessão e permissões
    db/           Prisma, guard e client por tenant
    services/     regras de negócio por domínio
prisma/           schema, migrations e seed
tests/            unitários e integração
```

## Documentação

Specs em [`docs/specs/manutenza`](docs/specs/manutenza) e plano de implementação em
[`docs/superpowers/plans`](docs/superpowers/plans).
