import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "cn";

/**
 * Estado vazio com ícone opcional, título, descrição e ação.
 * Quando `icon` é fornecido, mostra um círculo com o ícone.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/30 px-6 py-12 text-center",
        className,
      )}
      role="status"
    >
      {Icon ? (
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Icon aria-hidden className="size-5 text-muted-foreground" />
        </div>
      ) : null}
      <div className="flex flex-col gap-1">
        <p className="font-medium">{title}</p>
        {description ? (
          <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}