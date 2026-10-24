import Link from "next/link";

import { AppNav } from "@/components/app-nav";
import { AppSidebar } from "@/components/app-sidebar";
import { requireUser } from "@/server/auth/session";

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const user = await requireUser();

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar — apenas desktop (lg+) */}
      <div className="hidden lg:block">
        <AppSidebar
          isAdmin={user.role === "ADMIN"}
          companyName={user.companyName}
        />
      </div>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header mobile — nav horizontal */}
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur lg:hidden">
          <div className="flex h-12 items-center justify-between px-4">
            <Link href="/app" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
              <span
                aria-hidden
                className="flex size-6 items-center justify-center rounded-md bg-primary text-[10px] font-bold text-primary-foreground"
              >
                M
              </span>
              Manutenza
            </Link>
            <span className="truncate text-xs text-muted-foreground">
              {user.companyName}
            </span>
          </div>
          <div className="overflow-x-auto px-3 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <AppNav isAdmin={user.role === "ADMIN"} />
          </div>
        </header>

        {/* Content */}
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}