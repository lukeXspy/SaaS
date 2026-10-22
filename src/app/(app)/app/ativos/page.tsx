import type { AssetCategory, AssetStatus } from "@prisma/client";
import { Plus, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { NativeSelect } from "@/components/native-select";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  assetCategoryLabels,
  assetCategoryOptions,
  assetStatusLabels,
  assetStatusTone,
  criticalityLabels,
  criticalityTone,
} from "@/lib/labels";
import { assetCategories, assetStatuses } from "@/lib/validation/assets";
import { requireAdmin } from "@/server/auth/session";
import { listAssets } from "@/server/services/assets";

export const metadata: Metadata = {
  title: "Ativos",
};

function asCategory(value: string | string[] | undefined): AssetCategory | undefined {
  return typeof value === "string" && assetCategories.includes(value as AssetCategory)
    ? (value as AssetCategory)
    : undefined;
}

function asStatus(value: string | string[] | undefined): AssetStatus | undefined {
  return typeof value === "string" && assetStatuses.includes(value as AssetStatus)
    ? (value as AssetStatus)
    : undefined;
}

export default async function AssetsPage({ searchParams }: PageProps<"/app/ativos">) {
  const user = await requireAdmin();
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const category = asCategory(params.category);
  const status = asStatus(params.status);

  const assets = await listAssets(user.companyId, { query, category, status });
  const hasFilters = Boolean(query || category || status);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ativos"
        description="Equipamentos instalados nos locais dos seus clientes."
        action={
          <Link href="/app/ativos/novo" className={buttonVariants({ size: "sm" })}>
            <Plus aria-hidden />
            Novo ativo
          </Link>
        }
      />

      <form method="get" className="grid gap-2 sm:grid-cols-[1fr_170px_170px_auto]">
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            name="q"
            defaultValue={query}
            placeholder="TAG, nome ou número de série"
            className="pl-9"
            aria-label="Buscar ativos"
          />
        </div>
        <NativeSelect name="category" defaultValue={category ?? ""} aria-label="Categoria">
          <option value="">Todas as categorias</option>
          {assetCategoryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect name="status" defaultValue={status ?? ""} aria-label="Situação">
          <option value="">Todas as situações</option>
          {(Object.keys(assetStatusLabels) as AssetStatus[]).map((value) => (
            <option key={value} value={value}>
              {assetStatusLabels[value]}
            </option>
          ))}
        </NativeSelect>
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
      </form>

      {hasFilters ? (
        <Link
          href="/app/ativos"
          className="w-fit text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Limpar filtros
        </Link>
      ) : null}

      {assets.length === 0 ? (
        <EmptyState
          title={hasFilters ? "Nenhum ativo encontrado" : "Nenhum ativo cadastrado"}
          description={
            hasFilters
              ? "Ajuste os filtros ou cadastre um novo equipamento."
              : "Cadastre o primeiro equipamento com TAG para gerar o QR Code de identificação."
          }
          action={
            <Link href="/app/ativos/novo" className={buttonVariants({ size: "sm" })}>
              Cadastrar ativo
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {assets.map((asset) => (
            <li key={asset.id}>
              <Card className="p-4">
                <Link href={`/app/ativos/${asset.id}`} className="block">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-medium">
                          {asset.tag}
                        </span>
                        <p className="truncate font-medium">{asset.name}</p>
                      </div>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {asset.site.client.name} · {asset.site.name}
                        {asset.locationNote ? ` · ${asset.locationNote}` : ""}
                      </p>
                    </div>
                    <StatusBadge tone={assetStatusTone[asset.status]}>
                      {assetStatusLabels[asset.status]}
                    </StatusBadge>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusBadge>{assetCategoryLabels[asset.category]}</StatusBadge>
                    <StatusBadge tone={criticalityTone[asset.criticality]}>
                      Criticidade {criticalityLabels[asset.criticality].toLowerCase()}
                    </StatusBadge>
                  </div>
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
