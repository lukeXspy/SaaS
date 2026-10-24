"use client";

import {
  Building,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  UserCog,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "cn";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Wrench;
  adminOnly: boolean;
};

const groups: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Operação",
    items: [
      { href: "/app", label: "Painel", icon: LayoutDashboard, adminOnly: false },
      { href: "/app/ordens", label: "Ordens", icon: Wrench, adminOnly: true },
      { href: "/app/inspecoes", label: "Inspeções", icon: FileText, adminOnly: true },
    ],
  },
  {
    title: "Cadastro",
    items: [
      { href: "/app/clientes", label: "Clientes", icon: Users, adminOnly: true },
      { href: "/app/ativos", label: "Ativos", icon: Building, adminOnly: true },
      { href: "/app/checklists", label: "Checklists", icon: ClipboardList, adminOnly: true },
      { href: "/app/tecnicos", label: "Equipe", icon: UserCog, adminOnly: true },
    ],
  },
];

export function AppSidebar({
  isAdmin,
  companyName,
}: {
  isAdmin: boolean;
  companyName: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-dvh w-[220px] shrink-0 flex-col border-r border-border/60 bg-sidebar">
      {/* Logo + empresa */}
      <div className="flex h-12 items-center gap-2 border-b border-border/40 px-4">
        <span
          aria-hidden
          className="flex size-6 items-center justify-center rounded-md bg-primary text-[10px] font-bold text-primary-foreground"
        >
          M
        </span>
        <span className="truncate text-sm font-semibold tracking-tight">
          Manutenza
        </span>
      </div>

      {/* Nome da empresa */}
      <p className="truncate px-4 pt-4 pb-1 text-xs text-muted-foreground">
        {companyName}
      </p>

      {/* Nav groups */}
      <nav aria-label="Navegação principal" className="flex-1 overflow-y-auto px-2 py-2">
        {groups.map((group) => (
          <div key={group.title} className="mb-4">
            <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              {group.title}
            </p>
            <ul className="flex flex-col gap-0.5">
              {group.items
                .filter((item) => !item.adminOnly || isAdmin)
                .map((item) => {
                  const active =
                    item.href === "/app"
                      ? pathname === "/app"
                      : pathname.startsWith(item.href);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] font-medium",
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                        )}
                      >
                        <item.icon aria-hidden className="size-4 shrink-0" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Sair */}
      <div className="border-t border-border/40 p-2">
        <Link
          href="/api/logout"
          aria-label="Sair"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        >
          <LogOut aria-hidden className="size-4 shrink-0" />
          Sair
        </Link>
      </div>
    </aside>
  );
}