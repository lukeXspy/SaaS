"use client";

import { ClipboardCheck, Home, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "cn";

export function FieldNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  const items = [
    { href: "/campo", label: "Hoje", icon: Home, exact: true },
    { href: "/campo/inspecoes", label: "Inspeções", icon: ClipboardCheck, exact: false },
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
              "flex min-h-14 flex-1 flex-col items-center justify-center gap-1 px-3 py-2 text-xs font-medium",
              active ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <item.icon aria-hidden className="size-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}