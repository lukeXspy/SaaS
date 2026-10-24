# Manutenza — Brand & Design System

> **Regra para agentes de IA:** Consulte este arquivo antes de qualquer alteração visual no projeto. Se a mudança conflitar com os tokens ou princípios aqui definidos, discuta com o usuário antes de implementar.

---

## Princípio

**"Ferramenta, não vitrine."**

O Manutenza é usado 50x/dia por gestores de manutenção e técnicos de campo. Cada segundo de animação, cada pixel de glow é custo cumulativo. A UI deve ser **rápida, densa e confiável**.

- Escaneabilidade > Expressividade
- Densidade > Espaço em branco
- Instantâneo > Animado
- Confiável > Impressionante

## Modos por superfície

| Superfície | Modo | Estilo |
|---|---|---|
| Landing (`/`) | **Persuade** | Dark cinematográfico, amber, animações permitidas |
| Login (`/login`) | **Persuade** | Segue a landing, não o painel |
| Painel admin (`/app/*`) | **Operate** | Denso, sóbrio, zero decoração |
| Campo (`/campo/*`) | **Operate** | Mobile-first, alto contraste, touch generoso |

---

## Tokens (painel operacional)

### Cores (dark, OKLCH)

| Token | Valor | Uso |
|---|---|---|
| `--background` | `oklch(0.11 0.005 265)` | Fundo geral — escuro, reduz reflexo externo |
| `--card` | `oklch(0.15 0.008 265)` | Superfície de cards — sutilmente elevado |
| `--border` | `oklch(0.22 0.005 265)` | Bordas — só separa, não decora |
| `--foreground` | `oklch(0.88 0.005 265)` | Texto principal — não branco puro, menos fadiga |
| `--muted-foreground` | `oklch(0.58 0.008 265)` | Texto secundário/metadata |
| `--primary` | `oklch(0.72 0.14 75)` | Amber — APENAS primary actions e status active |
| `--primary-foreground` | `oklch(0.11 0.005 265)` | Texto sobre primary |
| `--destructive` | `oklch(0.62 0.20 25)` | Erros, cancelar |
| `--ring` | `oklch(0.72 0.14 75)` | Focus ring |

### Semânticas (badges, status)

| Tone | Bg | Texto | Uso |
|---|---|---|---|
| `info` | `sky-500/10` | `sky-400` | Aberta, aguardando |
| `warning` | `amber-500/10` | `amber-400` | Em andamento, alta prioridade |
| `success` | `emerald-500/10` | `emerald-400` | Concluída, ativo |
| `danger` | `red-500/10` | `red-400` | Atrasada, urgente |
| `neutral` | `muted` | `muted-foreground` | Cancelada, N/A |

### Tipografia

| Nível | Tamanho | Peso | Uso |
|---|---|---|---|
| Page title | `24px` | 600 | "Olá, Ana", "Ordens de serviço" |
| Section title | `16px` | 500 | "Ordens recentes", "OS por status" |
| Body | `14px` | 400 | Inputs, labels, conteúdo |
| List item | `13px` | 500 | Títulos de OS em linhas |
| Metadata | `13px` | 400 | Cliente, técnico, prazo |
| Stat value | `28px` | 600 tabular-nums | Números em stat cards |
| Stat label | `12px` | 400 | "Clientes ativos" |

### Espaçamento (densidade Linear)

| Elemento | Valor |
|---|---|
| Linhas de lista | `py-2.5` (10px) |
| Gap entre linhas | `0` (border-b separa) |
| Card padding | `p-4` (16px) |
| Gap entre cards | `gap-3` (12px) |
| Page padding | `px-6 py-8` |
| Sidebar width | `220px` |
| Header height | `h-12` |

### Radius

| Token | Valor | Justificativa |
|---|---|---|
| `--radius` | `0.5rem` (8px) | Menos arredondado = mais ferramenta |

---

## Regras de motion

| Regra | Aplicação |
|---|---|
| **Zero animações de entrada** | Página renderiza instantaneamente, sem fade/slide/blur |
| **Apenas `transition-colors`** | Hover em linhas, botões: 150ms |
| **Sem spring/float/glow** | Removidos do painel operacional |
| **Active feedback** | `scale(0.98)` apenas em touch, não desktop |

## Regras de decoração

| ❌ Proibido no painel | ✅ Em vez disso |
|---|---|
| Glow shadows (`shadow-[0_0_24px_...]`) | Border 1px + bg-card |
| Cinematic entrance (`cinematic-in-*`) | Renderização instantânea |
| Spring pop (`spring-pop`) | Aparecer sem animação |
| Ambient glow radial gradients | Background sólido |
| Float animation | Posição estática |
| Ícones decorativos em stat cards | Apenas número + label |

## Navegação

| Desktop | Mobile |
|---|---|
| Sidebar esquerda 220px, fixa | Nav horizontal no header (scroll) |
| Itens agrupados: Operação, Cadastro | Scroll pills |
| Ícone 16px + label 13px | Ícone + label |
| Item ativo: bg-primary/10 + texto primary | Idem |

### Grupos da sidebar

```
OPERação
  Ordens
  Inspeções
CADASTRO
  Clientes
  Ativos
  Checklists
  Equipe
```

---

## Componentes (regras por tipo)

### Stat cards (dashboard)
- Card com border, sem glow, sem ícone
- Valor: `text-2xl font-semibold tabular-nums`
- Label: `text-xs text-muted-foreground`
- Link para a página correspondente

### Listas (OS, clientes, ativos)
- **Linhas**, não cards
- Cada linha: `border-b border-border/40` + `hover:bg-muted/30`
- Estrutura: `OS # | Título | Cliente · Técnico | Prazo | Status badge`
- `py-2.5` entre linhas, gap 0

### Alertas (OS atrasadas)
- Banner fino `h-10`, não Card grande
- `bg-amber-500/8 border-l-2 border-amber-500/40`
- Texto 13px, dismissível em versão futura

### Filtros
- Chips inline no header da lista, não form de 5 selects
- Versão futura: dropdown "Filtros" com chips removíveis

### Badges (StatusBadge)
- Pill com ring, sem spring-pop
- Dot pulsante apenas para status ativos (IN_PROGRESS, WAITING_PARTS)

---

## Histórico de decisões

| Data | Decisão | Motivo |
|---|---|---|
| 2026-10-23 | Dark-first para painel | Uso externo, reduz reflexo, consistente com landing |
| 2026-10-23 | Amber accent, não roxo | Trabalho/energia; evita estética AI genérica |
| 2026-10-23 | Sidebar > nav horizontal | 7 itens não cabem em scroll horizontal sem perda de overview |
| 2026-10-23 | Linhas > cards para listas | Escaneabilidade com 20+ OS; cards não escalam |
| 2026-10-23 | Zero cinematic effects | Painel é Operate, não Persuade; velocidade de leitura |
| 2026-10-23 | Radius 8px | Mais "ferramenta", menos "startup" |
| 2026-10-23 | Referências: Linear + Stripe | Densidade (Linear) + hierarquia de dados (Stripe) |
