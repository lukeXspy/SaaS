# Manutenza — Rotas, páginas e APIs

## 1. Páginas (App Router)

Legenda: A = ADMIN, T = TÉCNICO.

### Públicas
| Rota | Arquivo | Função |
|---|---|---|
| `/` | `app/page.tsx` | Redireciona para `/dashboard` (A) ou `/campo` (T); deslogado → `/login` |
| `/login` | `(auth)/login/page.tsx` | E-mail + senha |
| `/esqueci-senha` | `(auth)/esqueci-senha/page.tsx` | Solicita link de redefinição |
| `/redefinir-senha/[token]` | `(auth)/redefinir-senha/[token]/page.tsx` | Define nova senha |
| `/convite/[token]` | `(auth)/convite/[token]/page.tsx` | Técnico aceita convite e cria senha |

### Área do gestor — `(app)` (A; T vê apenas leitura do que é dele)
| Rota | Função |
|---|---|
| `/dashboard` | KPIs: abertas, atrasadas, por técnico, por cliente, inspeções pendentes |
| `/ordens` | Lista com filtros (status, tipo, prioridade, técnico, cliente, período) |
| `/ordens/nova` | Criar OS |
| `/ordens/[id]` | Detalhe: dados, timeline, execução, itens, fotos, link do PDF |
| `/ordens/[id]/editar` | Editar campos da OS (bloqueado se DONE/CANCELED) |
| `/clientes` | Lista + busca |
| `/clientes/novo` | Criar cliente |
| `/clientes/[id]` | Ficha: dados, locais, ativos, histórico de OS |
| `/clientes/[id]/editar` | Editar cliente |
| `/clientes/[id]/locais/novo` | Criar local do cliente |
| `/locais/[id]` | Ficha do local + ativos |
| `/locais/[id]/editar` | Editar local |
| `/ativos` | Lista + busca por tag/nome/série |
| `/ativos/novo` | Criar ativo |
| `/ativos/[id]` | Ficha técnica + histórico + QR |
| `/ativos/[id]/editar` | Editar ativo |
| `/ativos/[id]/qrcode` | Etiqueta imprimível (QR + tag + nome) |
| `/inspecoes` | Lista (pendentes, em andamento, concluídas) |
| `/inspecoes/nova` | Agendar/criar inspeção (ativo + checklist + técnico + data) |
| `/inspecoes/[id]` | Resultado, respostas, falhas, OS geradas |
| `/checklists` | Lista de modelos |
| `/checklists/novo` | Criar modelo |
| `/checklists/[id]` | Ver modelo e itens |
| `/checklists/[id]/editar` | Editar modelo e itens |
| `/tecnicos` | Equipe, status, convites pendentes |
| `/tecnicos/[id]` | Ficha do técnico + OS atribuídas |
| `/configuracoes/empresa` | Nome, documento, contato, logo, rodapé do relatório |
| `/configuracoes/conta` | Nome, e-mail, senha |

### Área de campo — `(campo)` (T e A; layout mobile-first, navegação inferior)
| Rota | Função |
|---|---|
| `/campo` | "Meu dia": OS atribuídas por prazo + inspeções pendentes; botão "Iniciar" |
| `/campo/os/[id]` | Execução: dados resumidos, iniciar/pausar, tempo, diagnóstico, solução, itens, fotos, observações |
| `/campo/os/[id]/concluir` | Revisão final + assinatura do cliente + concluir |
| `/campo/inspecoes/[id]` | Executar checklist item a item (OK / Não OK / N/A, texto, número, foto) |

### Utilitárias
| Rota | Função |
|---|---|
| `/a/[token]` | Resolve QR: valida sessão, busca ativo por `qrToken` **na empresa do usuário**, redireciona para `/ativos/[id]` ou `/campo/os/nova?assetId=` |
| `not-found.tsx` / `error.tsx` | 404 e erro amigáveis em pt-BR |

## 2. Route Handlers

| Método | Rota | Auth | Função |
|---|---|---|---|
| `*` | `/api/auth/[...nextauth]` | — | Auth.js |
| `GET` | `/api/health` | pública | `{ status, version, db: "up" }` |
| `POST` | `/api/uploads/sign` | sessão | Valida intenção (entidade + tipo + mime + tamanho), devolve URL assinada e `storageKey` prefixado por `companyId` |
| `GET` | `/api/ordens/[id]/pdf` | sessão + escopo | Gera e devolve o PDF da OS (`Content-Disposition: inline`) |
| `GET` | `/api/ordens/[id]/pdf?download=1` | sessão + escopo | Força download |

Não haverá API REST pública no MVP. Integrações futuras entram em `/api/v1` com token por empresa.

## 3. Server Actions (mutações da UI)

Todas: `"use server"`, Zod na entrada, `requireSession()` interno, retorno `ActionResult<T>` (`{ ok: true, data } | { ok: false, code, message, fieldErrors? }`), `revalidatePath` no caminho afetado.

### auth
- `loginAction`, `logoutAction`
- `requestPasswordResetAction`, `resetPasswordAction`
- `acceptInviteAction`

### clients / sites
- `createClientAction`, `updateClientAction`, `archiveClientAction`
- `createSiteAction`, `updateSiteAction`, `archiveSiteAction`

### assets
- `createAssetAction`, `updateAssetAction`, `archiveAssetAction`
- `regenerateAssetQrAction`
- `createWorkOrderFromAssetAction` (atalho da ficha do ativo)

### work orders
- `createWorkOrderAction`
- `updateWorkOrderAction`
- `assignWorkOrderAction`
- `changeWorkOrderStatusAction` (valida transição)
- `cancelWorkOrderAction` (A)
- `reopenWorkOrderAction` (A, opcional — decisão pendente)

### execution
- `startWorkOrderAction` (status → IN_PROGRESS, grava `startedAt`)
- `saveExecutionDraftAction` (autosave dos campos)
- `setLaborMinutesAction`
- `addWorkOrderItemAction`, `updateWorkOrderItemAction`, `removeWorkOrderItemAction`
- `finishWorkOrderAction` (valida obrigatórios, grava assinatura, status → DONE)

### uploads
- `registerAttachmentAction` (confirma o upload e cria o registro)
- `deleteAttachmentAction` (remove objeto do Storage + registro)

### checklists
- `createTemplateAction`, `updateTemplateAction`, `archiveTemplateAction`
- `addTemplateItemAction`, `updateTemplateItemAction`, `removeTemplateItemAction`, `reorderTemplateItemsAction`

### inspections
- `createInspectionAction`
- `startInspectionAction`
- `saveInspectionResponseAction` (item a item, com autosave)
- `completeInspectionAction` (calcula score, valida obrigatórios/fotos)
- `generateWorkOrdersFromInspectionAction` (idempotente; A ou T responsável)
- `cancelInspectionAction` (A)

### team / company
- `inviteUserAction`, `resendInviteAction`, `revokeInviteAction`
- `deactivateUserAction`, `reactivateUserAction`, `changeUserRoleAction`
- `updateCompanyAction`, `uploadCompanyLogoAction`

## 4. Contratos e padrões

- Entrada de formulário: `FormData` → `Object.fromEntries` → `schema.parse` (Zod). IDs sempre `cuid` validados.
- Nenhum action aceita `companyId` no payload; vem da sessão.
- `ActionResult` nunca devolve stack trace; `AppError` mapeia para mensagem pt-BR.
- Paginação por cursor (`createdAt`/`id`) ou `page` + `pageSize` (máx. 100); listas têm busca e ordenação no servidor.
- `redirect()` só depois de sucesso, fora de `try/catch`.
- Upload: cliente comprime para WebP/JPEG (máx. 1600px, ~300 KB), pede URL assinada, envia direto ao Supabase, chama `registerAttachmentAction`.
