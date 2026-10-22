import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getSessionUser } from "@/server/auth/session";
import { findAssetByQrToken } from "@/server/services/assets";

export const metadata: Metadata = {
  title: "Ativo",
};

/** Resolve o QR Code: valida a sessão e busca o ativo apenas na empresa do usuário. */
export default async function QrResolvePage({ params }: PageProps<"/a/[token]">) {
  const { token } = await params;

  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/a/${token}`)}`);
  }

  const asset = await findAssetByQrToken(user.companyId, token);
  if (!asset) notFound();

  redirect(`/app/ativos/${asset.id}`);
}
