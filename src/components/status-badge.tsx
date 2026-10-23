import type { ReactNode } from "react";
import { cn } from "cn";

import type { Tone } from "@/lib/labels";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground ring-border",
  info: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-900",
  warning:
    "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900",
  success:
    "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900",
  danger:
    "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-900",
};

const activeTones: Partial<Record<Tone, string>> = {
  info: "badge-pulse",
  warning: "badge-pulse",
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
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        toneClasses[tone],
        pulse && activeTones[tone],
        className,
      )}
    >
      {pulse && (
        <span
          aria-hidden
          className="inline-block size-1.5 rounded-full bg-current opacity-70"
        />
      )}
      {children}
    </span>
  );
}