import {
  ArrowRight,
  Camera,
  ClipboardCheck,
  FileCheck,
  MapPin,
  QrCode,
  Smartphone,
  Wrench,
  Zap,
} from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

const highlights = [
  {
    icon: Wrench,
    title: "Ordens de serviço",
    description:
      "Abra, atribua e acompanhe corretivas, preventivas e inspeções com histórico completo.",
    accent: "text-amber-600 bg-amber-100 dark:bg-amber-950",
  },
  {
    icon: ClipboardCheck,
    title: "Inspeções com checklist",
    description:
      "Checklists reutilizáveis com foto, número e texto. Item reprovado gera OS automaticamente.",
    accent: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950",
  },
  {
    icon: Smartphone,
    title: "Feito para o campo",
    description:
      "Telas simples e rápidas no celular do técnico, com fotos, assinatura e relatório em PDF.",
    accent: "text-sky-600 bg-sky-100 dark:bg-sky-950",
  },
] as const;

const miniFeatures = [
  { icon: QrCode, text: "QR Code em cada ativo" },
  { icon: Camera, text: "Fotos direto do celular" },
  { icon: FileCheck, text: "PDF com assinatura" },
  { icon: MapPin, text: "Locais e endereços" },
  { icon: Zap, text: "OS corretiva automática" },
] as const;

export default function HomePage() {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      {/* Background: dot pattern com fade radial */}
      <div
        aria-hidden
        className="bg-dots pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black,transparent)]"
      />

      <main className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 py-10">
        {/* Header */}
        <header className="flex items-center justify-between">
          <span className="text-lg font-semibold tracking-tight">Manutenza</span>
          <Link
            href="/login"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Entrar
          </Link>
        </header>

        {/* Hero */}
        <section className="flex flex-1 flex-col justify-center gap-8 py-20 sm:py-24">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full bg-emerald-500" aria-hidden />
              Gestão de manutenção para pequenas equipes
            </span>
          </div>

          <h1
            className="animate-fade-up-1 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl"
          >
            Menos papel, menos WhatsApp.{" "}
            <span className="text-muted-foreground">Mais serviço concluído.</span>
          </h1>

          <p className="animate-fade-up-2 max-w-2xl text-lg text-muted-foreground text-pretty sm:text-xl">
            O Manutenza organiza clientes, locais, ativos e ordens de serviço da sua
            equipe técnica — do chamado ao relatório assinado pelo cliente.
          </p>

          <div className="animate-fade-up-3 flex flex-wrap items-center gap-4">
            <Link
              href="/login"
              className={`${buttonVariants({ size: "lg" })} btn-glow group gap-2`}
            >
              Acessar o sistema
              <ArrowRight
                aria-hidden
                className="size-4 transition-transform group-hover:translate-x-1"
              />
            </Link>
            <p className="text-sm text-muted-foreground">
              Grátis para começar · sem cartão de crédito
            </p>
          </div>

          {/* Mini features pills */}
          <div className="animate-fade-up-4 flex flex-wrap gap-2 pt-4">
            {miniFeatures.map((f) => (
              <span
                key={f.text}
                className="inline-flex items-center gap-1.5 rounded-full border bg-card/50 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur"
              >
                <f.icon aria-hidden className="size-3.5 text-amber-600" />
                {f.text}
              </span>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="grid gap-4 pb-12 sm:grid-cols-3">
          {highlights.map((item, i) => (
            <div
              key={item.title}
              className={`card-hover animate-fade-up-${i + 1} group rounded-xl border bg-card p-5`}
            >
              <div
                className={`inline-flex size-10 items-center justify-center rounded-lg ${item.accent}`}
              >
                <item.icon aria-hidden className="size-5" />
              </div>
              <h2 className="mt-4 font-medium">{item.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </section>

        {/* Footer */}
        <footer className="border-t py-6 text-center text-sm text-muted-foreground">
          Manutenza · feito para técnicos de campo ·{" "}
          <Link href="/login" className="underline-offset-4 hover:underline">
            Comece agora
          </Link>
        </footer>
      </main>
    </div>
  );
}