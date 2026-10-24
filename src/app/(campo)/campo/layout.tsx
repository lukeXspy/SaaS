import { LogOut } from "lucide-react";
import Link from "next/link";

import { FieldNav } from "@/components/field-nav";
import { requireUser } from "@/server/auth/session";

export default async function FieldLayout({ children }: LayoutProps<"/campo">) {
  const user = await requireUser();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-32 bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,color-mix(in_oklch,var(--primary)_3%,transparent),transparent)]"
      />
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-xl items-center justify-between gap-3 px-4">
          <Link href="/campo" className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <span
              aria-hidden
              className="flex size-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground"
            >
              M
            </span>
            Manutenza
          </Link>
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-xs text-muted-foreground">{user.companyName}</span>
            <Link
              href="/api/logout"
              aria-label="Sair"
              title="Sair"
              className="tactile inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LogOut aria-hidden className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-5 pb-24">{children}</main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
        <FieldNav isAdmin={user.role === "ADMIN"} />
      </div>
    </div>
  );
}