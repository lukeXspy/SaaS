import { LogOut } from "lucide-react";
import Link from "next/link";

import { AppNav } from "@/components/app-nav";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/server/actions/auth";
import { requireUser } from "@/server/auth/session";

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const user = await requireUser();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-5">
          <Link href="/app" className="truncate text-base font-semibold tracking-tight">
            Manutenza
          </Link>
          <div className="flex min-w-0 items-center gap-3">
            <span className="hidden truncate text-sm text-muted-foreground sm:block">
              {user.companyName}
            </span>
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" size="icon-sm" aria-label="Sair">
                <LogOut aria-hidden />
              </Button>
            </form>
          </div>
        </div>
        <div className="mx-auto w-full max-w-5xl overflow-x-auto px-3 pb-1">
          <AppNav isAdmin={user.role === "ADMIN"} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-6">{children}</main>
    </div>
  );
}
