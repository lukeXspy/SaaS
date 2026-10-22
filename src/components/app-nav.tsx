"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "cn";

const items = [
  { href: "/app", label: "Painel", adminOnly: false },
  { href: "/app/clientes", label: "Clientes", adminOnly: true },
  { href: "/app/ativos", label: "Ativos", adminOnly: true },
] as const;

export function AppNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  const visible = items.filter((item) => !item.adminOnly || isAdmin);

  return (
    <nav aria-label="Navegação principal" className="flex items-center gap-1">
      {visible.map((item) => {
        const active =
          item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
