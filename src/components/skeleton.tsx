import { cn } from "cn";

/**
 * Skeleton com shimmer — substitui spinners em conteúdo.
 * Usar `aria-busy` no container pai para acessibilidade.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("skeleton rounded-lg", className)}
    />
  );
}

/**
 * Skeleton para cards de estatística (dashboard).
 */
export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border p-4" aria-hidden>
      <Skeleton className="size-9 rounded-lg" />
      <Skeleton className="mt-3 h-8 w-12" />
      <Skeleton className="mt-1 h-3.5 w-20" />
    </div>
  );
}

/**
 * Skeleton para lista de itens (OS, clientes, etc).
 */
export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Carregando…" role="status">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border p-3">
          <Skeleton className="size-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}