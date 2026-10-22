import { ClipboardCheck, Smartphone, Wrench } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

const highlights = [
  {
    icon: Wrench,
    title: "Ordens de serviço",
    description:
      "Abra, atribua e acompanhe corretivas, preventivas e inspeções com histórico completo.",
  },
  {
    icon: ClipboardCheck,
    title: "Inspeções com checklist",
    description:
      "Checklists reutilizáveis com foto, número e texto. Item reprovado gera OS automaticamente.",
  },
  {
    icon: Smartphone,
    title: "Feito para o campo",
    description:
      "Telas simples e rápidas no celular do técnico, com fotos, assinatura e relatório em PDF.",
  },
] as const;

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 py-10">
      <header className="flex items-center justify-between">
        <span className="text-lg font-semibold tracking-tight">Manutenza</span>
        <Link href="/login" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Entrar
        </Link>
      </header>

      <section className="flex flex-1 flex-col justify-center gap-6 py-16">
        <p className="text-sm font-medium text-muted-foreground">
          Gestão de manutenção para pequenas equipes
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Menos papel, menos WhatsApp. Mais serviço concluído.
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground text-pretty">
          O Manutenza organiza clientes, locais, ativos e ordens de serviço da sua equipe técnica —
          do chamado ao relatório assinado pelo cliente.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/login" className={buttonVariants({ size: "lg" })}>
            Acessar o sistema
          </Link>
        </div>
      </section>

      <section className="grid gap-4 pb-10 sm:grid-cols-3">
        {highlights.map((item) => (
          <div key={item.title} className="rounded-xl border bg-card p-5">
            <item.icon aria-hidden className="mb-3 size-5 text-muted-foreground" />
            <h2 className="font-medium">{item.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
          </div>
        ))}
      </section>

      <footer className="border-t py-6 text-sm text-muted-foreground">
        Manutenza · feito para técnicos de campo
      </footer>
    </main>
  );
}
