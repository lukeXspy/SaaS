# Manutenza — Design do MVP

> Status: proposta para aprovação. Nenhum código de produto foi escrito.
> Escopo: SaaS B2B para empresas de manutenção (elétrica, refrigeração, automação) com 1–10 técnicos.

## 1. Intenção

Substituir WhatsApp + planilha + papel por um sistema único, mobile-first e em português, onde:

- o **gestor** enxerga o que está aberto, atrasado, com quem está e o que foi executado;
- o **técnico** executa a OS e a inspeção pelo celular, com fotos, checklist e assinatura;
- o **cliente final** recebe um PDF apresentável do serviço.

O sucesso do MVP é medido por: uma OS consegue nascer, ser executada em campo e virar PDF sem sair do sistema.

## 2. Escopo

### Dentro
1. Autenticação, convite de usuários e multi-tenant por `companyId`.
2. Perfis ADMIN (dono/gestor) e TECHNICIAN.
3. Clientes, locais e ativos (com tag, QR e ficha técnica).
4. Ordens de serviço com tipo, prioridade, status, vínculos, responsável e prazo.
5. Execução pelo técnico: tempo, diagnóstico, solução, peças/serviços, observações, fotos.
6. Checklists reutilizáveis (OK / Não OK / N/A, texto, número, foto).
7. Inspeções e geração automática de OS a partir de item reprovado.
8. PDF da OS com logo, dados, fotos, checklist, itens e assinatura.
9. Dashboard operacional.

### Fora (não implementar sem nova decisão)
Estoque, financeiro/faturamento, ERP, app nativo, WhatsApp, BI, IA no produto, agenda/calendário completo, notificações push, portal do cliente, offline sync.

### Anti-metas
- Não ser um ERP. Nenhum campo de preço/imposto/nota fiscal no MVP.
- Não ter tela desktop-first. A execução precisa funcionar em pé, com uma mão, em 3G.
- Não expor dados entre empresas em nenhuma hipótese, inclusive por ID manipulado.

## 3. Decisões de arquitetura (já tomadas)

| # | Decisão | Justificativa |
|---|---|---|
| D1 | Banco único, schema único, `companyId` em toda entidade de negócio | Requisito do briefing; simples de operar e testar em 1–10 técnicos |
| D2 | Isolamento em 3 camadas: sessão → serviço escopado → extensão Prisma que exige `companyId` | Defesa em profundidade sem depender de disciplina do dev |
| D3 | Server Actions para mutações da UI; Route Handlers só para PDF, upload assinado, auth e health | Menos superfície de API, menos duplicação de validação |
| D4 | React PDF (`@react-pdf/renderer`) | Puppeteer/Chromium não cabe bem no limite de tempo da Vercel |
| D5 | Supabase (Postgres + Storage, região `sa-east-1`) | Um fornecedor, latência Brasil, URLs assinadas |
| D6 | Upload direto do browser para o Storage via URL assinada | Evita o limite de 4,5 MB de body da Vercel |
| D7 | IDs `cuid()`; enums em inglês, rótulos pt-BR centralizados em `src/lib/labels.ts` | Código estável, UI traduzida num só lugar |
| D8 | Sem delete físico de negócio: `isActive`, status `CANCELED`, arquivamento | Histórico e relatórios confiáveis |
| D9 | Uma execução por OS no MVP (relação 1:1) | Simples; virar 1:N depois é migration aditiva |
| D10 | Numeração de OS sequencial por empresa (`Company.workOrderSequence`) | Número que o cliente reconhece; incremento atômico |
| D11 | Datas em UTC no banco, exibição em `America/Sao_Paulo` | Evita bugs de fuso em prazo/atraso |
| D12 | Sem i18n; pt-BR fixo | Escopo |
| D13 | Tema/tokens shadcn com foco em uso com luva e sol na tela | Contraste alto, alvos ≥ 44px |

## 4. Stack e versões

- Next.js (App Router) + TypeScript `strict`
- Tailwind CSS + shadcn/ui
- PostgreSQL + Prisma
- Auth.js v5 (Credentials + JWT session) — **pendente de confirmação** vs Clerk
- Supabase Storage (bucket privado, URL assinada)
- `@react-pdf/renderer`
- Zod para toda entrada
- Vitest + Testing Library (unit/integration), Playwright (e2e)
- Deploy: Vercel + Supabase

## 5. Estrutura de pastas

```
manutenza/
├─ .env.example
├─ .gitignore
├─ components.json                 # shadcn
├─ eslint.config.mjs
├─ next.config.ts
├─ package.json
├─ playwright.config.ts
├─ postcss.config.mjs
├─ prettier.config.mjs
├─ tailwind.config.ts
├─ tsconfig.json
├─ vitest.config.ts
├─ README.md
├─ docs/
│  ├─ specs/manutenza/
│  │  ├─ design.md
│  │  ├─ data-model.md
│  │  ├─ routes-and-api.md
│  │  └─ implementation-plan.md
│  └─ runbooks/deploy.md
├─ prisma/
│  ├─ schema.prisma
│  ├─ migrations/
│  └─ seed.ts
├─ public/
│  ├─ logo.svg
│  ├─ icons/
│  └─ fonts/                       # fontes embutidas no PDF
├─ src/
│  ├─ middleware.ts
│  ├─ app/
│  │  ├─ layout.tsx
│  │  ├─ globals.css
│  │  ├─ page.tsx
│  │  ├─ not-found.tsx
│  │  ├─ error.tsx
│  │  ├─ (auth)/
│  │  │  ├─ layout.tsx
│  │  │  ├─ login/page.tsx
│  │  │  ├─ esqueci-senha/page.tsx
│  │  │  ├─ redefinir-senha/[token]/page.tsx
│  │  │  └─ convite/[token]/page.tsx
│  │  ├─ (app)/
│  │  │  ├─ layout.tsx
│  │  │  ├─ dashboard/page.tsx
│  │  │  ├─ ordens/
│  │  │  │  ├─ page.tsx
│  │  │  │  ├─ nova/page.tsx
│  │  │  │  └─ [id]/
│  │  │  │     ├─ page.tsx
│  │  │  │     └─ editar/page.tsx
│  │  │  ├─ clientes/
│  │  │  │  ├─ page.tsx
│  │  │  │  ├─ novo/page.tsx
│  │  │  │  └─ [id]/
│  │  │  │     ├─ page.tsx
│  │  │  │     ├─ editar/page.tsx
│  │  │  │     └─ locais/novo/page.tsx
│  │  │  ├─ locais/[id]/
│  │  │  │  ├─ page.tsx
│  │  │  │  └─ editar/page.tsx
│  │  │  ├─ ativos/
│  │  │  │  ├─ page.tsx
│  │  │  │  ├─ novo/page.tsx
│  │  │  │  └─ [id]/
│  │  │  │     ├─ page.tsx
│  │  │  │     ├─ editar/page.tsx
│  │  │  │     └─ qrcode/page.tsx
│  │  │  ├─ inspecoes/
│  │  │  │  ├─ page.tsx
│  │  │  │  ├─ nova/page.tsx
│  │  │  │  └─ [id]/page.tsx
│  │  │  ├─ checklists/
│  │  │  │  ├─ page.tsx
│  │  │  │  ├─ novo/page.tsx
│  │  │  │  └─ [id]/
│  │  │  │     ├─ page.tsx
│  │  │  │     └─ editar/page.tsx
│  │  │  ├─ tecnicos/
│  │  │  │  ├─ page.tsx
│  │  │  │  └─ [id]/page.tsx
│  │  │  └─ configuracoes/
│  │  │     ├─ empresa/page.tsx
│  │  │     └─ conta/page.tsx
│  │  ├─ (campo)/                 # área mobile do técnico
│  │  │  ├─ layout.tsx
│  │  │  ├─ campo/page.tsx
│  │  │  ├─ campo/os/[id]/page.tsx
│  │  │  ├─ campo/os/[id]/concluir/page.tsx
│  │  │  └─ campo/inspecoes/[id]/page.tsx
│  │  ├─ a/[token]/page.tsx       # resolve QR do ativo
│  │  └─ api/
│  │     ├─ auth/[...nextauth]/route.ts
│  │     ├─ health/route.ts
│  │     ├─ uploads/sign/route.ts
│  │     └─ ordens/[id]/pdf/route.ts
│  ├─ components/
│  │  ├─ ui/                      # shadcn (gerado)
│  │  ├─ layout/
│  │  │  ├─ app-shell.tsx
│  │  │  ├─ sidebar.tsx
│  │  │  ├─ topbar.tsx
│  │  │  └─ mobile-nav.tsx
│  │  ├─ shared/
│  │  │  ├─ data-table.tsx
│  │  │  ├─ empty-state.tsx
│  │  │  ├─ pagination.tsx
│  │  │  ├─ confirm-dialog.tsx
│  │  │  ├─ status-badge.tsx
│  │  │  ├─ priority-badge.tsx
│  │  │  ├─ page-header.tsx
│  │  │  └─ search-input.tsx
│  │  ├─ forms/
│  │  │  ├─ form-field.tsx
│  │  │  ├─ form-error.tsx
│  │  │  └─ submit-button.tsx
│  │  ├─ clients/
│  │  │  ├─ client-form.tsx
│  │  │  ├─ site-form.tsx
│  │  │  └─ client-picker.tsx
│  │  ├─ assets/
│  │  │  ├─ asset-form.tsx
│  │  │  ├─ asset-card.tsx
│  │  │  ├─ asset-picker.tsx
│  │  │  └─ qr-label.tsx
│  │  ├─ work-orders/
│  │  │  ├─ work-order-form.tsx
│  │  │  ├─ work-order-table.tsx
│  │  │  ├─ work-order-card.tsx
│  │  │  ├─ status-select.tsx
│  │  │  ├─ assign-select.tsx
│  │  │  ├─ work-order-timeline.tsx
│  │  │  ├─ execution-form.tsx
│  │  │  ├─ item-editor.tsx
│  │  │  └─ finish-dialog.tsx
│  │  ├─ inspections/
│  │  │  ├─ inspection-form.tsx
│  │  │  ├─ checklist-runner.tsx
│  │  │  ├─ checklist-item.tsx
│  │  │  ├─ inspection-summary.tsx
│  │  │  └─ failures-panel.tsx
│  │  ├─ checklists/
│  │  │  ├─ template-form.tsx
│  │  │  └─ template-item-editor.tsx
│  │  └─ uploads/
│  │     ├─ photo-uploader.tsx
│  │     └─ signature-pad.tsx
│  ├─ server/
│  │  ├─ auth/
│  │  │  ├─ auth.ts
│  │  │  ├─ auth.config.ts
│  │  │  ├─ guards.ts
│  │  │  ├─ password.ts
│  │  │  └─ session.ts
│  │  ├─ db/
│  │  │  ├─ client.ts
│  │  │  ├─ tenant-extension.ts
│  │  │  └─ pagination.ts
│  │  ├─ permissions/
│  │  │  ├─ matrix.ts
│  │  │  └─ can.ts
│  │  ├─ services/
│  │  │  ├─ clients/{client.service.ts,site.service.ts}
│  │  │  ├─ assets/asset.service.ts
│  │  │  ├─ work-orders/
│  │  │  │  ├─ work-order.service.ts
│  │  │  │  ├─ work-order-number.ts
│  │  │  │  ├─ work-order-status.ts
│  │  │  │  ├─ execution.service.ts
│  │  │  │  └─ item.service.ts
│  │  │  ├─ checklists/template.service.ts
│  │  │  ├─ inspections/
│  │  │  │  ├─ inspection.service.ts
│  │  │  │  └─ inspection-to-work-order.ts
│  │  │  ├─ dashboard/dashboard.service.ts
│  │  │  ├─ reports/work-order-pdf.service.ts
│  │  │  ├─ storage/{storage.service.ts,supabase-storage.ts}
│  │  │  └─ users/{user.service.ts,invite.service.ts}
│  │  ├─ actions/
│  │  │  ├─ auth.actions.ts
│  │  │  ├─ client.actions.ts
│  │  │  ├─ site.actions.ts
│  │  │  ├─ asset.actions.ts
│  │  │  ├─ work-order.actions.ts
│  │  │  ├─ execution.actions.ts
│  │  │  ├─ checklist.actions.ts
│  │  │  ├─ inspection.actions.ts
│  │  │  ├─ user.actions.ts
│  │  │  └─ company.actions.ts
│  │  ├─ validators/
│  │  │  ├─ common.ts
│  │  │  ├─ client.ts
│  │  │  ├─ site.ts
│  │  │  ├─ asset.ts
│  │  │  ├─ work-order.ts
│  │  │  ├─ execution.ts
│  │  │  ├─ checklist.ts
│  │  │  ├─ inspection.ts
│  │  │  ├─ user.ts
│  │  │  └─ company.ts
│  │  └─ pdf/
│  │     ├─ work-order-document.tsx
│  │     ├─ fonts.ts
│  │     ├─ styles.ts
│  │     └─ sections/
│  │        ├─ header.tsx
│  │        ├─ client-asset.tsx
│  │        ├─ execution.tsx
│  │        ├─ items.tsx
│  │        ├─ checklist.tsx
│  │        ├─ photos.tsx
│  │        ├─ signature.tsx
│  │        └─ footer.tsx
│  ├─ lib/
│  │  ├─ env.ts
│  │  ├─ errors.ts
│  │  ├─ result.ts
│  │  ├─ constants.ts
│  │  ├─ labels.ts
│  │  ├─ routes.ts
│  │  ├─ utils.ts
│  │  └─ format/{date.ts,phone.ts,document.ts,bytes.ts}
│  ├─ hooks/
│  │  ├─ use-media-query.ts
│  │  ├─ use-unsaved-changes.ts
│  │  └─ use-toast.ts
│  └─ types/
│     ├─ domain.ts
│     ├─ next-auth.d.ts
│     └─ actions.ts
├─ tests/
│  ├─ setup.ts
│  ├─ unit/{validators,work-order-status,permissions}.test.ts
│  └─ integration/{tenant-isolation,work-orders,inspections}.test.ts
└─ e2e/
   ├─ auth.spec.ts
   ├─ work-order.spec.ts
   ├─ inspection.spec.ts
   └─ pdf.spec.ts
```

### Regra de tamanho
Nenhum arquivo de código acima de ~300 linhas. Ao passar disso: extrair seção, hook ou serviço. Componentes de página só orquestram; regra de negócio vive em `src/server/services`.

## 6. Convenções transversais

- **Validação**: todo input externo passa por Zod (`src/server/validators`). Server Action nunca confia em `companyId` vindo do cliente.
- **Erros**: `AppError` com `code` (`UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION`, `CONFLICT`, `LIMIT_EXCEEDED`) + mensagem pt-BR. Acesso a registro de outra empresa retorna **404**, nunca 403 (não revela existência).
- **Sessão**: `{ userId, companyId, role, name }` no JWT. `getSession()` só no servidor.
- **Consultas**: todo service recebe `TenantContext` como primeiro argumento. A extensão Prisma rejeita query em modelo de tenant sem `companyId` no `where`/`data`.
- **Datas**: armazenar UTC; `dueAt` é timestamp; UI formata em `America/Sao_Paulo`; "atrasada" = `dueAt < now()` e status não final.
- **UI**: pt-BR, voz ativa, sem jargão. Alvos de toque ≥ 44px. Formulários com `label` real, erro junto do campo, foco no primeiro erro.
- **Mobile**: `/campo/**` é a única área otimizada para celular; o restante é responsivo mas desktop-first.

## 7. Restrição de orçamento zero (decidido em 2026-10-21)

O projeto precisa operar com **R$ 0**. Tudo abaixo foi escolhido para caber nos planos gratuitos.

| Item | Escolha | Limite grátis | Mitigação |
|---|---|---|---|
| Auth | **Auth.js v5** (Clerk custa ~US$ 25/mês) | ilimitado | — |
| Banco | **Supabase Free** (Postgres) | 500 MB | Dados de texto do MVP cabem com folga; monitorar |
| Arquivos | **Supabase Storage** (bucket privado) | 1 GB, 5 GB egress | Compressão para ~300 KB/foto ≈ 3.000 fotos; limpeza de órfãos |
| Deploy | **Netlify Free** | 100 GB banda, 300 min build | Uso comercial permitido. Vercel Hobby é grátis, mas restrito a uso **não comercial** — usar só para preview/demo |
| E-mail | **Nenhum provedor** | — | Convite e reset geram **link copiável** que o admin envia por WhatsApp; interface `LinkDelivery` pronta para Resend depois |
| Monitoramento | Error boundaries + logs da plataforma | — | Sentry Free (5k erros/mês) opcional na fase 8 |
| Domínio | subdomínio gratuito (`*.netlify.app`) | — | Domínio próprio (~R$ 40/ano) fica para depois |
| Backups | `pg_dump` semanal via GitHub Actions | 2.000 min/mês | Artifact privado de 90 dias; restore testado |
| CI | GitHub Actions | 2.000 min/mês | — |
| Package manager | **npm** (Node 24 já instalado; pnpm ausente) | — | — |

Consequências de produto:
- **Não haverá "esqueci minha senha" autoatendido** no MVP: o admin gera um link de redefinição em `/tecnicos/[id]` e envia ao usuário. A página `/esqueci-senha` explica o caminho.
- Convite idem: o admin copia o link e envia. Isso combina com o hábito do público (WhatsApp) e elimina custo e dependência de domínio verificado.
- O projeto Supabase free **pausa após 7 dias sem atividade**; um workflow semanal faz um `select 1` para manter ativo.
- Se o produto começar a cobrar, o primeiro upgrade é hospedagem (Netlify Pro ou Vercel Pro), não o banco.

## 8. Variáveis de ambiente

```
DATABASE_URL=            # pooler (6543)
DIRECT_URL=              # conexão direta (5432), migrations
AUTH_SECRET=
AUTH_URL=
AUTH_TRUST_HOST=true
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=manutenza
NEXT_PUBLIC_SUPABASE_URL=
# opcional (fase 8+): RESEND_API_KEY, SENTRY_DSN
```

## 9. Ordem de execução aprovada

1. Fase 0 (fundação) e Fase 1 (auth + tenant) — plano detalhado em `docs/superpowers/plans/2026-10-21-manutenza-fase-0-1.md`.
2. Fases 2–8 — um plano por fase, escritos ao final da fase anterior.

## 8. Integridade e isolamento

1. `companyId` obrigatório em todas as entidades de negócio.
2. Toda leitura/escrita passa por service com `TenantContext`.
3. Extensão Prisma (`tenant-extension.ts`) lança erro se um modelo de tenant for consultado sem `companyId`.
4. Testes de integração obrigatórios: usuário da empresa A tentando ler/editar OS, ativo, inspeção e anexo da empresa B → 404.
5. Uploads: chave sempre prefixada por `companyId`; URL assinada de curta duração; bucket privado.
6. Hardening opcional (fase 8): RLS no Postgres com `SET LOCAL app.company_id` por transação.
