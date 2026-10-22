import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";

import { PrintButton } from "@/components/print-button";
import { getAppUrl } from "@/lib/app-url";
import { requireAdmin } from "@/server/auth/session";
import { getAsset } from "@/server/services/assets";

export const metadata: Metadata = {
  title: "Etiqueta QR Code",
};

export default async function AssetQrPage({ params }: PageProps<"/app/ativos/[id]/qrcode">) {
  const user = await requireAdmin();
  const { id } = await params;
  const asset = await getAsset(user.companyId, id);

  if (!asset) notFound();

  const url = `${getAppUrl()}/a/${asset.qrToken}`;
  const qrDataUrl = await QRCode.toDataURL(url, {
    width: 640,
    margin: 1,
    errorCorrectionLevel: "Q",
  });

  return (
    <div className="flex flex-col gap-6 print:gap-0">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link
          href={`/app/ativos/${asset.id}`}
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Voltar para o ativo
        </Link>
        <PrintButton />
      </div>

      <div className="mx-auto w-full max-w-sm rounded-2xl border-2 p-6 text-center print:border print:shadow-none">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {user.companyName}
        </p>
        <p className="mt-3 font-mono text-2xl font-bold tracking-wider">{asset.tag}</p>
        <p className="mt-1 text-base font-medium">{asset.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {asset.site.client.name} · {asset.site.name}
        </p>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt={`QR Code do ativo ${asset.tag}`}
          className="mx-auto mt-4 size-56"
        />

        <p className="mt-4 text-xs text-muted-foreground">
          Aponte a câmera do celular para abrir a ficha do ativo.
        </p>
        <p className="mt-1 text-[10px] break-all text-muted-foreground">{url}</p>
      </div>
    </div>
  );
}
