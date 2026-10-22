# Manutenza — Plano de implementação, riscos e decisões abertas

## 1. Estratégia

Fatias verticais finas, cada uma entregando algo usável e testável. Nenhuma fase começa antes da anterior estar verde em `lint + typecheck + unit + e2e do fluxo`.

Ordem pensada para reduzir retrabalho: identidade e isolamento primeiro, porque tudo depende disso; PDF por último entre as features, porque consome dados de todas as anteriores.

Estimativa total: **18–25 dias úteis** de um dev sênior (sem contar ajustes de branding/PDF além do previsto).

## 2. Fases

### Fase 0 — Fundação (0,5–1 dia)
- Repositório, `next create` (TS strict, App Router, Tailwind, `src/`), shadcn init.
- ESLint, Prettier, `tsconfig` estrito (`noUncheckedIndexedAccess`, `noImplicitOverride`).
- `src/lib/env.ts` validando env com Zod na inicialização.
- Projeto Supabase (`sa-east-1`), bucket privado, `DATABASE_URL` (pooler) + `DIRECT_URL`.
- Prisma init, `schema.prisma` vazio, primeira migration, `/api/health`.
- CI: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.

**Pronto quando:** CI verde, `/api/health` responde `db: up`, deploy de preview na Vercel funcionando.

### Fase 1 — Auth e multi-tenant (1,5–2 dias)
- Models `Company`, `User`, `Invite`, `PasswordResetToken` + migration + seed (1 admin, 2 técnicos, 1 empresa demo).
- Auth.js Credentials (bcrypt/argon2), JWT com `companyId`/`role`.
- Login, logout, convite, aceite, reset de senha (Resend em dev com Mailpit/console).
- `middleware.ts`, `requireSession`, `requireRole`.
- Extensão Prisma de tenant + `TenantContext`.
- Testes de isolamento (A não lê/escreve B) para `User` e `Company`.

**Pronto quando:** admin loga, convida técnico, técnico aceita e cai em `/campo`; teste cruzado retorna 404; nenhuma query de tenant sem `companyId`.

### Fase 2 — Clientes, locais e ativos (2–3 dias)
- CRUD com busca, paginação, estados vazios e validação Zod.
- Ativo com tag única por empresa, categoria, criticidade, série.
- QR: geração (`qrToken`), página `/a/[token]`, etiqueta imprimível (A4, 3x3 ou 2x2).
- Ficha do ativo com histórico de OS.

**Pronto quando:** fluxo cliente → local → ativo completo; QR abre o ativo certo; etiqueta imprime legível; testes de isolamento e de tag duplicada.

### Fase 3 — Núcleo de OS (3–4 dias)
- Numeração atômica por empresa (`UPDATE ... RETURNING` em transação).
- Criação, listagem com filtros e ordenação, detalhe, edição.
- Máquina de estados + histórico (`WorkOrderStatusHistory`).
- Atribuição a técnico, prazo, prioridade, tipo.
- Dashboard v1: abertas, atrasadas, por técnico, por cliente.

**Pronto quando:** criar/atribuir/transicionar respeitando regras; dashboard confere com queries; e2e cria OS e muda status; transição inválida retorna erro claro.

### Fase 4 — Execução mobile (3–4 dias)
- `/campo` com OS do técnico e inspeções pendentes.
- Iniciar/concluir, tempo gasto, diagnóstico, solução, observações.
- Itens (peças/serviços) com quantidade e unidade.
- Fotos: compressão no cliente, upload assinado, registro de anexo, exclusão.
- Assinatura em canvas → PNG → Storage.
- Autosave do rascunho de execução.

**Pronto quando:** um técnico executa uma OS inteira em viewport 390×844 (Playwright), com 3 fotos e assinatura, e o admin vê tudo; upload de 8 MB é rejeitado com mensagem clara.

### Fase 5 — Checklists e inspeções (3–4 dias)
- Editor de modelos e itens (4 tipos), reordenação.
- Criação/agendamento de inspeção, execução item a item, autosave.
- Cálculo de score; validação de obrigatórios e foto em falha.
- "Não OK" → gerar OS corretiva (uma por item), idempotente, com confirmação.
- Lista de inspeções pendentes no dashboard.

**Pronto quando:** inspeção completa ponta a ponta; 2 cliques no botão de gerar não criam 2 OS; item sem foto obrigatória bloqueia conclusão; testes de idempotência.

### Fase 6 — PDF da OS (2–3 dias)
- `@react-pdf/renderer` no Node runtime (não Edge).
- Cabeçalho com logo da empresa, número, cliente, local, ativo, técnico, datas.
- Execução, itens, checklist respondido, grade de fotos, assinatura, rodapé.
- Fontes com acentuação embutidas; imagens buscadas como bytes do Storage.
- Paginação e limite de fotos (padrão 8, com aviso).

**Pronto quando:** PDF em < 5 s com 8 fotos; acentos corretos; dados de outra empresa jamais aparecem; abre em celular e desktop.

### Fase 7 — Dashboard e polimento (2 dias)
- Filtros de período, cards clicáveis, "atrasadas" com regra única.
- Estados de loading/erro/vazio; skeletons.
- Acessibilidade: labels, foco, contraste, navegação por teclado, alvos ≥ 44px.
- Revisão de textos pt-BR e mensagens de erro.

**Pronto quando:** Lighthouse mobile ≥ 90 em `/campo`; nenhum `console.error` nos fluxos; revisão de copy concluída.

### Fase 8 — Hardening e go-live (2–3 dias)
- Rate limit no login e no reset; logs estruturados; Sentry.
- Políticas do bucket; varredura de anexos órfãos.
- Backup/restore testado; runbook de deploy.
- LGPD: termos, política de retenção de fotos, fluxo de exclusão a pedido.
- Seed de demonstração para vendas; smoke test em produção.

**Pronto quando:** checklist de produção assinado, restore validado, smoke test verde, domínio e e-mail transacional configurados.

## 3. Estratégia de testes

| Nível | Ferramenta | Cobertura mínima |
|---|---|---|
| Unit | Vitest | Validators Zod, máquina de estados, cálculo de score, permissões |
| Integração | Vitest + Postgres de teste | Services com dois tenants; numeração concorrente; idempotência da OS gerada |
| E2E | Playwright | Login/convite, OS completa, inspeção com falha → OS, PDF |
| Manual | Checklist | Câmera real (iOS/Android), impressão de etiqueta, PDF no celular |

Regra: bug de isolamento entre empresas é **P0** e ganha teste de regressão antes do fix.

## 4. Riscos técnicos

| # | Risco | Impacto | Mitigação |
|---|---|---|---|
| R1 | Vazamento entre tenants por ID manipulados | Crítico (contrato/legal) | Guards + service escopado + extensão Prisma + testes; RLS na fase 8 |
| R2 | Upload em campo com rede ruim | Alto (adoção) | Compressão no cliente, upload direto ao Storage, retry, feedback por foto; offline real fica fora do MVP (ver Q4) |
| R3 | Limite de 4,5 MB de body na Vercel | Alto | URL assinada + upload direto; nunca passar arquivo por Server Action |
| R4 | PDF lento/estourando timeout | Médio | React PDF, imagens redimensionadas, limite de fotos, streaming, cache por versão |
| R5 | Fonte sem acento no PDF | Médio | Embutir Inter/Manrope TTF; teste com "ção, ã, ç" |
| R6 | Numeração duplicada em concorrência | Médio | Incremento atômico em transação + `@@unique([companyId, number])` + retry |
| R7 | Fuso horário em prazo/atraso | Médio | UTC no banco, `America/Sao_Paulo` na borda, testes de virada de dia |
| R8 | Auth.js v5 + Edge + Prisma | Médio | `auth.config.ts` sem Prisma para o middleware; runtime Node nas rotas com DB |
| R9 | Custo/privacidade de fotos (LGPD) | Médio | Bucket privado, retenção definida, exclusão, região Brasil, consentimento no contrato |
| R10 | Escopo crescendo (estoque, financeiro) | Alto | Fora do escopo escrito; nova feature exige nova decisão |
| R11 | HEIC do iPhone não abre no browser | Baixo/Médio | Converter no cliente ou aceitar e converter no servidor |
| R12 | Assinatura "jurídica" | Baixo | Assinatura eletrônica simples + registro de nome/data/IP no PDF; não é certificado ICP-Brasil |
| R13 | Técnico sem celular adequado | Médio | Design leve, alvos grandes, funciona em 3G; testar em Android modesto |

## 5. Decisões pendentes (precisam de resposta)

| # | Pergunta | Recomendação |
|---|---|---|
| Q1 | Auth.js ou Clerk? | **Auth.js** se houver Resend/SMTP e alguém para manter; **Clerk** se a prioridade for lançar em 2 semanas e aceitar ~US$ 25/mês |
| Q2 | Técnico vê só as OS dele ou todas da empresa? | **Só as dele** (menos ruído e menos risco); admin pode reatribuir |
| Q3 | O dono também executa OS? | Sim, se `ADMIN` puder ser atribuído; caso contrário, criar papel `MANAGER` depois |
| Q4 | Precisa funcionar offline? | **Não no MVP**, mas decidir agora: se sim, entra fila local (IndexedDB) + sync, +5–8 dias |
| Q5 | Itens de OS levam preço/valor? | **Não** (financeiro fora do escopo). Se o PDF precisa de valor, muda o escopo |
| Q6 | Um "Não OK" gera uma OS por item ou uma OS com todos os itens? | **Uma por item**, com confirmação; evita OS gigante e facilita priorização |
| Q7 | Técnico pode criar inspeção avulsa? | **Não** no MVP; admin agenda |
| Q8 | Onboarding de empresa: self-signup ou manual? | **Manual** (você cria empresa + admin) até validar; self-signup exige billing/antiabuso |
| Q9 | Assinatura: canvas no celular ou upload de imagem? | **Canvas**; fallback "cliente não assinou" com justificativa |
| Q10 | Precisa de notificação por e-mail ao atribuir OS? | Fora do MVP; se necessário, +1 dia (Resend + template) |
| Q11 | Logo: upload pelo admin ou URL fixa? | Upload (Supabase Storage), PNG/SVG até 1 MB |
| Q12 | Quantas fotos por OS no PDF? | 8 padrão, configurável depois |
| Q13 | Retenção de fotos/PDFs? | Definir com o cliente (ex.: 5 anos para laudos); impacta custo |
| Q14 | Marca: nome "Manutenza" é definitivo? Tem logo/cores? | Se sim, entram na fase 0; se não, uso tokens neutros |

## 6. Perguntas que eu preciso que você responda antes de codar

**Bloqueantes (mudam arquitetura):**
1. Auth.js ou Clerk? (Q1)
2. Offline é requisito real? (Q4)
3. Preço/valor em itens de OS? (Q5)
4. Técnico vê só as próprias OS? (Q2)

**Importantes (mudam escopo de tela):**
5. Um "Não OK" gera uma OS por item ou uma OS agregada? (Q6)
6. O dono/gestor também executa OS? (Q3)
7. Onboarding manual ou self-signup? (Q8)
8. Precisa de e-mail ao atribuir OS? (Q10)

**Podem ficar no default se você disser "vai com os defaults":**
9. Logo por upload (Q11), 8 fotos no PDF (Q12), retenção de 5 anos (Q13), marca neutra (Q14).

## 7. Respostas — 2026-10-21

Você aprovou as recomendações e informou orçamento **R$ 0**. Ficam decididos:

| # | Decisão |
|---|---|
| Q1 | **Auth.js v5** (sem custo) |
| Q2 | Técnico vê **apenas as próprias OS** |
| Q3 | **ADMIN pode executar OS** (é atribuível) |
| Q4 | **Sem offline** no MVP |
| Q5 | Itens **sem preço** |
| Q6 | **Uma OS por item reprovado**, com confirmação |
| Q7 | Técnico **não** cria inspeção avulsa |
| Q8 | Onboarding **manual** (admin cria empresa e convida) |
| Q9 | Assinatura em **canvas** |
| Q10 | **Sem e-mail** de atribuição; convite/reset por link copiável |
| Q11 | Logo por **upload** |
| Q12 | **8 fotos** por PDF |
| Q13 | Retenção **5 anos** (configurável no futuro) |
| Q14 | Marca **neutra** até existir identidade visual |

Infra de custo zero (detalhada em `design.md`, seção 7): Supabase Free + Netlify Free + GitHub Actions + npm. Vercel Hobby apenas para preview, por restrição de uso comercial.
