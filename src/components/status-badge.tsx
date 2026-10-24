import type { ReactNode } from "react";
import { cn } from "cn";

import type { Tone } from "@/lib/labels";

/*
 * Badge de status — pill com ring, SEM spring-pop (BRAND.md).
 * `pulse` adiciona apenas o dot animado para status ativos.
 */
const toneClasses: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground ring-border",
  info: "bg-sky-500/10 text-sky-400 ring-sky-500/20",
  warning: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  success: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  danger: "bg-red-500/10 text-red-400 ring-red-500/20",
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
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
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