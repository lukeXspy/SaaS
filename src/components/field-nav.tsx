"use client";

import { CheckCircle2, Home, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "cn";

export function FieldNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  const items = [
    { href: "/campo", label: "Hoje", icon: Home, exact: true },
    { href: "/campo/inspecoes", label: "Inspeções", icon: CheckCircle2, exact: false },
    ...(isAdmin
      ? [{ href: "/app", label: "Gestão", icon: LayoutDashboard, exact: false }]
      : []),
  ];

  return (
    <nav aria-label="Navegação de campo" className="mx-auto flex w-full max-w-xl items-center">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "tactile flex min-h-14 flex-1 flex-col items-center justify-center gap-1 px-3 py-2 text-xs font-medium transition-colors",
              active
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <item.icon aria-hidden className="size-5" />
            {item.label}
            {/* Indicador — dot glow */}
            {active && (
              <span
                aria-hidden
                className="absolute top-0 h-0.5 w-8 rounded-full bg-primary shadow-[0_0_8px_color-mix(in_oklch,var(--primary)_60%,transparent)]"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}