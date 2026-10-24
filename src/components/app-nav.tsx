"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building, ClipboardList, FileText, LayoutDashboard, UserCog, Users, Wrench } from "lucide-react";

import { cn } from "cn";

const items = [
  { href: "/app", label: "Painel", icon: LayoutDashboard, adminOnly: false },
  { href: "/app/ordens", label: "Ordens", icon: Wrench, adminOnly: true },
  { href: "/app/clientes", label: "Clientes", icon: Users, adminOnly: true },
  { href: "/app/ativos", label: "Ativos", icon: Building, adminOnly: true },
  { href: "/app/checklists", label: "Checklists", icon: ClipboardList, adminOnly: true },
  { href: "/app/inspecoes", label: "Inspeções", icon: FileText, adminOnly: true },
  { href: "/app/tecnicos", label: "Equipe", icon: UserCog, adminOnly: true },
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
              "tactile relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <item.icon aria-hidden className="size-4" />
            {item.label}
            {/* Indicador ativo — barra glow embaixo */}
            {active && (
              <span
                aria-hidden
                className="absolute inset-x-3 -bottom-2 h-0.5 rounded-full bg-primary shadow-[0_0_8px_color-mix(in_oklch,var(--primary)_50%,transparent)]"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}