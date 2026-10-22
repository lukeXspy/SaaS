# Manutenza — Permissões e fluxos de acesso

## 1. Modelo

Dois papéis no MVP:

| Papel | Quem é | Poder |
|---|---|---|
| `ADMIN` | Dono/gestor | Vê e administra tudo da própria empresa |
| `TECHNICIAN` | Técnico de campo | Vê e executa apenas o que está atribuído a ele |

Não há permissão customizável por usuário no MVP. A matriz é código (`src/server/permissions/matrix.ts`), não banco.

## 2. Sessão

`auth.ts` (Auth.js, JWT) grava no token: `userId`, `companyId`, `role`, `name`.
- `companyId` e `role` **nunca** vêm do cliente.
- Usuário inativo → sessão invalidada no próximo request (`isActive` checado no `jwt` callback ou no `requireSession`).
- Troca de papel exige novo login (ou `updateSession`); documentado na UI.

## 3. Guards

```
middleware.ts        → só presença de cookie; redireciona para /login
requireSession()     → sem sessão: redirect /login (páginas) ou AppError UNAUTHORIZED (actions)
requireRole("ADMIN") → 404 para TECHNICIAN em página; FORBIDDEN em action
requireCompanyCtx()  → { companyId, userId, role }
```

Regra de ouro: **404, não 403**, quando o recurso existe em outra empresa. Não confirmar existência.

## 4. Matriz de permissões

| Recurso / ação | ADMIN | TECHNICIAN |
|---|---|---|
| Dashboard completo | ✅ | ❌ (usa `/campo`) |
| Clientes — ver | ✅ todos | 👁 só os vinculados a OS/inspeção dele |
| Clientes — criar/editar/arquivar | ✅ | ❌ |
| Locais — ver | ✅ todos | 👁 vinculados |
| Locais — criar/editar/arquivar | ✅ | ❌ |
| Ativos — ver | ✅ todos | 👁 vinculados |
| Ativos — criar/editar/arquivar | ✅ | ❌ |
| Ativos — QR | ✅ gerar/imprimir | ✅ escanear |
| OS — criar | ✅ | ❌ (sistema cria a partir de inspeção) |
| OS — ver | ✅ todas | 👁 apenas `assignedToId = userId` |
| OS — editar campos, prazo, prioridade | ✅ | ❌ |
| OS — atribuir/reatribuir técnico | ✅ | ❌ |
| OS — mudar status | ✅ qualquer transição válida | ⚠️ só OPEN→IN_PROGRESS, IN_PROGRESS→WAITING_PARTS, WAITING_PARTS→IN_PROGRESS, IN_PROGRESS→DONE (via conclusão) |
| OS — cancelar / reabrir | ✅ | ❌ |
| Execução — ver | ✅ | 👁 própria |
| Execução — editar | ✅ | ✅ própria, enquanto não concluída |
| Execução — itens (peças/serviços) | ✅ | ✅ própria, enquanto não concluída |
| Execução — fotos | ✅ | ✅ própria |
| Execução — concluir + assinatura | ✅ | ✅ própria |
| Checklists — ver | ✅ | 👁 (precisa entender o que vai responder) |
| Checklists — criar/editar/arquivar | ✅ | ❌ |
| Inspeções — criar/agendar | ✅ | ❌ (decisão pendente) |
| Inspeções — ver | ✅ todas | 👁 atribuídas a ele |
| Inspeções — executar | ✅ | ✅ atribuídas a ele |
| Inspeções — gerar OS de falha | ✅ | ✅ a partir da inspeção dele |
| Inspeções — cancelar | ✅ | ❌ |
| PDF da OS | ✅ todas | ✅ das próprias |
| Equipe — convidar/desativar/papel | ✅ | ❌ |
| Empresa — dados/logo | ✅ | ❌ |
| Conta própria (nome/senha) | ✅ | ✅ |

## 5. Fluxo — ADMIN

1. `/login` → sessão com `role=ADMIN` → `/dashboard`.
2. Vê KPIs e listas completas da empresa.
3. Cadastra cliente → local → ativo (ou importa depois, fora do escopo).
4. Cria checklist (opcional) e OS, atribui técnico, define prazo.
5. Acompanha status e execução em tempo real (refresh/revalidate).
6. Abre `/ordens/[id]` → baixa PDF assinado.
7. Convida técnico em `/tecnicos` (e-mail com token, validade 7 dias).
8. Configura logo/rodapé — usados no PDF e nos e-mails.

## 6. Fluxo — TECHNICIAN

1. Recebe convite → `/convite/[token]` → define senha → sessão `role=TECHNICIAN`.
2. Cai em `/campo` (não em `/dashboard`), com navegação inferior de 3 itens: **Hoje**, **Inspeções**, **Conta**.
3. "Hoje" lista OS atribuídas ordenadas por prazo, com badge de atraso e botão grande **Iniciar**.
4. `/campo/os/[id]`: inicia (status `IN_PROGRESS`), registra tempo, diagnóstico, solução, itens, fotos.
5. Finaliza em `/campo/os/[id]/concluir`: revisa, coleta assinatura na tela, conclui → `DONE`.
6. Inspeção pendente → `/campo/inspecoes/[id]`: responde item a item; cada **Não OK** pode gerar OS corretiva imediatamente (com confirmação) já atribuída a ele.
7. Técnico **não** vê: dashboard, cadastro de clientes/ativos, outros técnicos, configurações, OS de colegas.

## 7. Defesa em profundidade

| Camada | O que impede |
|---|---|
| Middleware | Acesso anônimo a rotas privadas |
| `requireRole` | Técnico abrindo telas de gestão |
| Service com `TenantContext` | Query sem filtro de empresa |
| Extensão Prisma | Esquecimento de `companyId` no `where`/`data` (lança erro em dev e prod) |
| Verificação de vínculo | Técnico abrindo OS de colega (404) |
| Storage policy | Download de arquivo de outra empresa (path + política) |
| Testes de isolamento | Regressão de vazamento entre tenants |

## 8. Casos de borda definidos

- **OS desatribuída**: técnico perde acesso imediatamente; se estava `IN_PROGRESS`, o admin vê o histórico e decide reatribuir.
- **Técnico desativado**: não loga; OS dele continuam visíveis ao admin e precisam ser reatribuídas.
- **OS concluída**: execução vira somente leitura; alteração exige reabertura (ADMIN) e fica no histórico.
- **Inspeção concluída**: respostas imutáveis; correção exige nova inspeção.
- **QR de ativo de outra empresa**: 404, mesmo com token válido.
- **Link de PDF**: sempre revalidado na sessão; nunca é link público permanente.
