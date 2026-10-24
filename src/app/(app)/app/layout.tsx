import { LogOut } from "lucide-react";
import Link from "next/link";

import { AppNav } from "@/components/app-nav";
import { requireUser } from "@/server/auth/session";

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const user = await requireUser();

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Ambient glow — sutil, do topo */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,color-mix(in_oklch,var(--primary)_4%,transparent),transparent)]"
      />
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-5">
          <Link href="/app" className="flex items-center gap-2 truncate text-base font-semibold tracking-tight">
            <span
              aria-hidden
              className="flex size-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground"
            >
              M
            </span>
            <span className="hidden sm:inline">{user.companyName}</span>
            <span className="sm:hidden">Manutenza</span>
          </Link>
          <Link
            href="/api/logout"
            aria-label="Sair"
            title="Sair"
            className="tactile inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut aria-hidden className="size-4" />
          </Link>
        </div>
        <div className="mx-auto w-full max-w-5xl overflow-x-auto px-3 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <AppNav isAdmin={user.role === "ADMIN"} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-6">{children}</main>
    </div>
  );
}