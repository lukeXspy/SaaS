import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  MapPin,
  Play,
  QrCode,
  ScanLine,
  Signature,
  Smartphone,
  Sparkles,
  Wrench,
  Zap,
} from "lucide-react";
import Link from "next/link";

const stats = [
  { value: "R$ 0", label: "para começar" },
  { value: "3 min", label: "para cadastrar" },
  { value: "100%", label: "em português" },
  { value: "0", label: "papel e planilha" },
] as const;

const features = [
  {
    icon: ClipboardCheck,
    title: "Ordens de serviço",
    description:
      "Corretivas, preventivas e inspeções com numeração automática, prioridades, prazos e histórico completo de cada mudança.",
  },
  {
    icon: Smartphone,
    title: "Feito para o campo",
    description:
      "O técnico abre no celular: inicia, registra tempo, lança peças, tira fotos e coleta a assinatura do cliente — sem voltar ao escritório.",
  },
  {
    icon: QrCode,
    title: "QR Code em cada ativo",
    description:
      "Cada equipamento tem uma etiqueta QR. O técnico escaneia e vê a ficha completa, histórico de OS e abre um chamado na hora.",
  },
  {
    icon: FileText,
    title: "Relatório PDF profissional",
    description:
      "Ao concluir, o sistema gera um PDF com logo da empresa, dados do cliente, fotos da execução e assinatura — pronto para enviar.",
  },
  {
    icon: Zap,
    title: "Inspeção que gera OS",
    description:
      "Checklist reutilizável: item reprovado cria automaticamente uma OS corretiva atribuída ao técnico, sem retrabalho.",
  },
  {
    icon: BarChart3,
    title: "Painel do gestor",
    description:
      "Acompanhe OS abertas, atrasadas, por técnico e por cliente. Saiba o que está acontecendo sem ligar para ninguém.",
  },
] as const;

const steps = [
  {
    number: "01",
    title: "Cadastre",
    description: "Clientes, locais e ativos com TAG única e QR Code.",
    icon: MapPin,
  },
  {
    number: "02",
    title: "Acione",
    description: "Abra a OS, atribua ao técnico e defina o prazo.",
    icon: Wrench,
  },
  {
    number: "03",
    title: "Conclua",
    description: "Técnico executa, assina e o PDF sai pronto.",
    icon: Signature,
  },
] as const;

const testimonials = [
  {
    quote:
      "Antes eu anotava tudo em caderno e digitava à noite. Agora o técnico já fecha a OS no local e o cliente assina na hora.",
    name: "Ricardo Almeida",
    role: "Refrigeração comercial · 4 técnicos",
  },
  {
    quote:
      "O QR Code no equipamento mudou tudo. O cliente escaneia e a gente já sabe qual é o aparelho e todo o histórico.",
    name: "Fernanda Souza",
    role: "Manutenção predial · 6 técnicos",
  },
  {
    quote:
      "A inspeção que reprova item já cria a OS corretiva sozinha. Economizei umas 3 horas por semana só nisso.",
    name: "Marcos Pereira",
    role: "Elétrica industrial · 8 técnicos",
  },
] as const;

const pricing = [
  {
    name: "Grátis",
    price: "R$ 0",
    period: "para sempre",
    description: "Para começar e organizar a equipe.",
    features: [
      "Até 3 usuários",
      "Ordens de serviço ilimitadas",
      "Assinatura e PDF",
      "QR Code em ativos",
    ],
    cta: "Começar agora",
    highlight: false,
  },
  {
    name: "Pro",
    price: "R$ 49",
    period: "/mês",
    description: "Para empresas que crescem.",
    features: [
      "Usuários ilimitados",
      "Tudo do Grátis",
      "Checklists e inspeções",
      "Fotos no Storage",
      "Painel de gestão",
      "Suporte prioritário",
    ],
    cta: "Começar 14 dias grátis",
    highlight: true,
  },
] as const;

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 antialiased">
      {/* ─────────────────────────────────────────────
          NAVBAR
         ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span
              aria-hidden
              className="flex size-8 items-center justify-center rounded-lg bg-amber-500 text-sm font-bold text-slate-950"
            >
              M
            </span>
            Manutenza
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-slate-400 sm:flex">
            <a href="#recursos" className="transition-colors hover:text-white">Recursos</a>
            <a href="#como-funciona" className="transition-colors hover:text-white">Como funciona</a>
            <a href="#precos" className="transition-colors hover:text-white">Preços</a>
          </nav>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-950 transition-all hover:bg-slate-200 active:scale-[0.98]"
          >
            Entrar
            <ArrowRight aria-hidden className="size-3.5" />
          </Link>
        </div>
      </header>

      {/* ─────────────────────────────────────────────
          HERO
         ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(245,158,11,0.08),transparent)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,black,transparent)]"
        />

        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-8 px-5 pb-20 pt-24 text-center sm:pt-32">
          {/* Badge */}
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-1.5 text-sm text-amber-400">
              <Sparkles aria-hidden className="size-3.5" />
              Gestão de manutenção para pequenas equipes
            </span>
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up-1 max-w-4xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            Do chamado ao{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                relatório assinado
              </span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="animate-fade-up-2 max-w-2xl text-balance text-lg leading-relaxed text-slate-400 sm:text-xl">
            O Manutenza substitui caderno, planilha e grupo de WhatsApp. O técnico
            executa no celular, o cliente assina na hora e o PDF sai pronto para você.
          </p>

          {/* CTAs */}
          <div className="animate-fade-up-3 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-amber-500/25 transition-all hover:bg-amber-400 hover:shadow-amber-400/30 active:scale-[0.98]"
            >
              Acessar o sistema
              <ArrowRight
                aria-hidden
                className="size-4 transition-transform group-hover:translate-x-1"
              />
            </Link>
            <a
              href="#recursos"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-base font-medium text-slate-200 backdrop-blur transition-all hover:border-white/20 hover:bg-white/10 active:scale-[0.98]"
            >
              <Play aria-hidden className="size-4" />
              Ver como funciona
            </a>
          </div>

          {/* Floating OS cards mockup */}
          <div className="animate-fade-up-4 relative mt-12 w-full max-w-4xl">
            <div className="pointer-events-none absolute -inset-x-4 -top-4 bottom-0 rounded-[2rem] bg-gradient-to-b from-amber-500/10 to-transparent blur-2xl" aria-hidden />
            <div className="relative grid gap-3 sm:grid-cols-3">
              {[
                {
                  icon: ScanLine,
                  label: "OS #47",
                  title: "Split não gela — Sala 2",
                    detail: "Condomínio Jardim das Flores",
                  status: "Em andamento",
                  statusColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                },
                {
                  icon: CheckCircle2,
                  label: "OS #46",
                  title: "Preventiva mensal — CH-01",
                  detail: "Torre A — Área comum",
                  status: "Concluída",
                  statusColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                },
                {
                  icon: Zap,
                  label: "OS #45",
                  title: "Inspeção → Corretiva",
                  detail: "Item reprovado no checklist",
                  status: "Gerada automaticamente",
                  statusColor: "bg-sky-500/10 text-sky-400 border-sky-500/20",
                },
              ].map((card, i) => (
                <div
                  key={card.label}
                  className={`animate-float rounded-2xl border border-white/8 bg-slate-900/80 p-4 text-left backdrop-blur ${i === 1 ? "animate-float-delayed" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">{card.label}</span>
                    <card.icon aria-hidden className="size-4 text-slate-600" />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-200">{card.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{card.detail}</p>
                  <span
                    className={`mt-3 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${card.statusColor}`}
                  >
                    {card.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          STATS
         ───────────────────────────────────────────── */}
      <section className="border-y border-white/5 bg-slate-900/30">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-8 px-5 py-10 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-semibold tracking-tight text-amber-400 sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          FEATURES
         ───────────────────────────────────────────── */}
      <section id="recursos" className="mx-auto w-full max-w-6xl px-5 py-20 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-amber-400">
            Recursos
          </p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Tudo que sua equipe precisa, nada que ela não usa
          </h2>
          <p className="mt-4 text-pretty text-lg text-slate-400">
            Feito para 1-10 técnicos. Sem complexidade de ERP, sem curso de 40 horas.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-white/8 bg-slate-900/50 p-6 transition-all duration-300 hover:border-amber-500/20 hover:bg-slate-900/80"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20">
                <feature.icon aria-hidden className="size-5 text-amber-400" />
              </div>
              <h3 className="mt-5 font-semibold text-slate-100">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          HOW IT WORKS
         ───────────────────────────────────────────── */}
      <section id="como-funciona" className="border-y border-white/5 bg-slate-900/30 py-20 sm:py-28">
        <div className="mx-auto w-full max-w-6xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-amber-400">
              Como funciona
            </p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Três passos. Zero retrabalho.
            </h2>
          </div>

          <div className="relative mt-16 grid gap-8 sm:grid-cols-3">
            {/* Connecting line (desktop) */}
            <div
              aria-hidden
              className="absolute top-16 right-[16%] left-[16%] hidden h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent sm:block"
            />
            {steps.map((step) => (
              <div key={step.number} className="relative flex flex-col items-center text-center">
                <div className="relative z-10 flex size-14 items-center justify-center rounded-2xl bg-slate-950 ring-1 ring-amber-500/30">
                  <step.icon aria-hidden className="size-6 text-amber-400" />
                </div>
                <p className="mt-4 text-xs font-bold tracking-widest text-amber-400/60">
                  {step.number}
                </p>
                <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 max-w-xs text-sm text-slate-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          TESTIMONIALS
         ───────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-5 py-20 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-amber-400">
            Quem usa
          </p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Técnicos de campo, não de escritório
          </h2>
        </div>

        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col gap-4 rounded-2xl border border-white/8 bg-slate-900/50 p-6"
            >
              <blockquote className="text-pretty text-sm leading-relaxed text-slate-300">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-auto flex items-center gap-3 border-t border-white/5 pt-4">
                <span
                  aria-hidden
                  className="flex size-10 items-center justify-center rounded-full bg-amber-500/10 text-sm font-bold text-amber-400"
                >
                  {t.name[0]}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-200">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          PRICING
         ───────────────────────────────────────────── */}
      <section id="precos" className="border-y border-white/5 bg-slate-900/30 py-20 sm:py-28">
        <div className="mx-auto w-full max-w-5xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-amber-400">
              Preços
            </p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Simples e transparente
            </h2>
            <p className="mt-4 text-slate-400">
              Comece grátis. Faça upgrade quando a equipe crescer.
            </p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:mx-auto lg:max-w-3xl">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-8 ${
                  plan.highlight
                    ? "border-amber-500/40 bg-slate-900 shadow-xl shadow-amber-500/10"
                    : "border-white/8 bg-slate-900/50"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-slate-950">
                    Mais popular
                  </span>
                )}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="mt-1 text-sm text-slate-400">{plan.description}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                  <span className="text-sm text-slate-500">{plan.period}</span>
                </div>
                <ul className="mt-6 flex flex-col gap-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle2 aria-hidden className="size-4 shrink-0 text-emerald-400" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all active:scale-[0.98] ${
                    plan.highlight
                      ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400"
                      : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight aria-hidden className="size-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          FINAL CTA
         ───────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-5 py-20 sm:py-28">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 p-12 text-center ring-1 ring-white/10 sm:p-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,rgba(245,158,11,0.1),transparent)]"
          />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Sua equipe técnica merece melhor que um caderno
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-pretty text-lg text-slate-400">
              Crie sua conta em 3 minutos. Importe clientes, gere QR Codes e emita
              a primeira OS hoje.
            </p>
            <Link
              href="/login"
              className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-8 py-4 text-base font-semibold text-slate-950 shadow-xl shadow-amber-500/25 transition-all hover:bg-amber-400 active:scale-[0.98]"
            >
              Começar agora — é grátis
              <ArrowRight
                aria-hidden
                className="size-5 transition-transform group-hover:translate-x-1"
              />
            </Link>
            <p className="mt-4 text-sm text-slate-500">
              Sem cartão de crédito · sem fidelidade · em português
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          FOOTER
         ───────────────────────────────────────────── */}
      <footer className="border-t border-white/5 bg-slate-950">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-12 sm:grid-cols-3">
          <div>
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span
                aria-hidden
                className="flex size-7 items-center justify-center rounded-lg bg-amber-500 text-xs font-bold text-slate-950"
              >
                M
              </span>
              Manutenza
            </Link>
            <p className="mt-3 max-w-xs text-sm text-slate-500">
              Gestão de manutenção para pequenas equipes de campo. Do chamado ao
              relatório assinado.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <p className="font-medium text-slate-300">Produto</p>
            <a href="#recursos" className="text-slate-500 transition-colors hover:text-white">Recursos</a>
            <a href="#como-funciona" className="text-slate-500 transition-colors hover:text-white">Como funciona</a>
            <a href="#precos" className="text-slate-500 transition-colors hover:text-white">Preços</a>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <p className="font-medium text-slate-300">Contato</p>
            <a href="mailto:contato@manutenza.app" className="text-slate-500 transition-colors hover:text-white">
              contato@manutenza.app
            </a>
            <Link href="/login" className="text-slate-500 transition-colors hover:text-white">
              Entrar no sistema
            </Link>
          </div>
        </div>
        <div className="border-t border-white/5 py-6 text-center text-sm text-slate-600">
          © 2026 Manutenza · Feito no Brasil para técnicos de campo
        </div>
      </footer>
    </div>
  );
}