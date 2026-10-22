import { ArrowLeft, MapPin, Pencil, QrCode } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAppUrl } from "@/lib/app-url";
import { formatDateOnly } from "@/lib/format";
import {
  assetCategoryLabels,
  assetStatusLabels,
  assetStatusTone,
  criticalityLabels,
  criticalityTone,
} from "@/lib/labels";
import { setAssetStatusAction } from "@/server/actions/assets";
import { requireUser } from "@/server/auth/session";
import { getAssetForViewer } from "@/server/services/assets";

export const metadata: Metadata = {
  title: "Detalhe do ativo",
};

export default async function AssetDetailPage({ params }: PageProps<"/app/ativos/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const asset = await getAssetForViewer(user.companyId, id, {
    userId: user.id,
    role: user.role,
  });

  if (!asset) notFound();

  const isAdmin = user.role === "ADMIN";
  const qrUrl = `${getAppUrl()}/a/${asset.qrToken}`;
  const qrDataUrl = isAdmin
    ? await QRCode.toDataURL(qrUrl, { width: 320, margin: 1 })
    : null;

  const details = [
    { label: "Fabricante", value: asset.manufacturer },
    { label: "Modelo", value: asset.model },
    { label: "Número de série", value: asset.serialNumber },
    {
      label: "Instalação",
      value: asset.installationDate ? formatDateOnly(asset.installationDate) : null,
    },
    {
      label: "Garantia até",
      value: asset.warrantyUntil ? formatDateOnly(asset.warrantyUntil) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {isAdmin ? (
        <Link
          href="/app/ativos"
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Voltar para ativos
        </Link>
      ) : null}

      <PageHeader
        title={asset.name}
        description={`TAG ${asset.tag}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={assetStatusTone[asset.status]}>
              {assetStatusLabels[asset.status]}
            </StatusBadge>
            {isAdmin ? (
              <Link
                href={`/app/ativos/${asset.id}/editar`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <Pencil aria-hidden />
                Editar
              </Link>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Card>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge>{assetCategoryLabels[asset.category]}</StatusBadge>
              <StatusBadge tone={criticalityTone[asset.criticality]}>
                Criticidade {criticalityLabels[asset.criticality].toLowerCase()}
              </StatusBadge>
            </div>

            <div className="rounded-lg border p-3">
              <p className="flex items-start gap-1.5 text-sm">
                <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span>
                  {isAdmin ? (
                    <>
                      <Link
                        href={`/app/clientes/${asset.site.client.id}`}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {asset.site.client.name}
                      </Link>
                      {" · "}
                      <Link
                        href={`/app/locais/${asset.site.id}/editar`}
                        className="underline-offset-4 hover:underline"
                      >
                        {asset.site.name}
                      </Link>
                    </>
                  ) : (
                    <>
                      <span className="font-medium">{asset.site.client.name}</span>
                      {" · "}
                      {asset.site.name}
                    </>
                  )}
                  {asset.locationNote ? ` · ${asset.locationNote}` : ""}
                </span>
              </p>
            </div>

            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              {details.map((item) => (
                <div key={item.label}>
                  <dt className="text-muted-foreground">{item.label}</dt>
                  <dd className="font-medium">{item.value || "—"}</dd>
                </div>
              ))}
            </dl>

            {asset.notes ? (
              <div>
                <p className="text-sm text-muted-foreground">Observações</p>
                <p className="mt-1 rounded-lg bg-muted px-3 py-2 text-sm whitespace-pre-line">
                  {asset.notes}
                </p>
              </div>
            ) : null}

            {isAdmin ? (
              <div className="flex flex-wrap gap-2 border-t pt-4">
                <form action={setAssetStatusAction}>
                  <input type="hidden" name="id" value={asset.id} />
                  <input
                    type="hidden"
                    name="status"
                    value={asset.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"}
                  />
                  <SubmitButton variant="outline" size="sm" pendingText="Atualizando…">
                    {asset.status === "ACTIVE" ? "Desativar ativo" : "Reativar ativo"}
                  </SubmitButton>
                </form>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {isAdmin && qrDataUrl ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 text-center">
              <QrCode aria-hidden className="size-5 text-muted-foreground" />
              <p className="text-sm font-medium">QR Code do ativo</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt={`QR Code do ativo ${asset.tag}`}
                className="size-48 rounded-lg border bg-white p-2"
              />
              <p className="text-xs break-all text-muted-foreground">{qrUrl}</p>
              <Link
                href={`/app/ativos/${asset.id}/qrcode`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Imprimir QR Code
              </Link>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
