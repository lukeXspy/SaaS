import type { ReactNode } from "react";
import { cn } from "cn";

import type { Tone } from "@/lib/labels";

/*
 * Badges cinematográficos — cores com glow sutil em dark.
 * `pulse` adiciona dot indicador animado para status ativos.
 */
const toneClasses: Record<Tone, string> = {
  neutral:
    "bg-muted text-muted-foreground ring-border",
  info:
    "bg-sky-500/10 text-sky-400 ring-sky-500/20 shadow-[0_0_12px_rgba(56,189,248,0.08)]",
  warning:
    "bg-amber-500/10 text-amber-400 ring-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.08)]",
  success:
    "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.08)]",
  danger:
    "bg-red-500/10 text-red-400 ring-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.08)]",
};

export function StatusBadge({
  tone = "neutral",
  pulse = false,
  className,
  children,
}: {
  tone?: Tone;
  pulse?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "spring-pop inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        toneClasses[tone],
        className,
      )}
    >
      {pulse && (
        <span
          aria-hidden
          className="badge-pulse inline-block size-1.5 shrink-0 rounded-full bg-current"
        />
      )}
      {children}
    </span>
  );
}