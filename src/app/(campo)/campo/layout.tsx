import { LogOut } from "lucide-react";
import Link from "next/link";

import { FieldNav } from "@/components/field-nav";
import { requireUser } from "@/server/auth/session";

export default async function FieldLayout({ children }: LayoutProps<"/campo">) {
  const user = await requireUser();

  return (
    <div className="flex min-h-dvh flex-col bg-muted/30">
      <header className="sticky top-0 z-30 border-b bg-background">
        <div className="mx-auto flex h-14 w-full max-w-xl items-center justify-between gap-3 px-4">
          <Link href="/campo" className="text-base font-semibold tracking-tight">
            Manutenza
          </Link>
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-xs text-muted-foreground">{user.companyName}</span>
            <Link
              href="/api/logout"
              aria-label="Sair"
              title="Sair"
              className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut aria-hidden className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-5 pb-24">{children}</main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background pb-[env(safe-area-inset-bottom)]">
        <FieldNav isAdmin={user.role === "ADMIN"} />
      </div>
    </div>
  );
}
