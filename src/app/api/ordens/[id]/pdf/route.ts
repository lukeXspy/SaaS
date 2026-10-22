import { getSessionUser } from "@/server/auth/session";
import { renderWorkOrderPdf } from "@/server/pdf/work-order-pdf";
import { getWorkOrder } from "@/server/services/work-orders";
import { downloadMedia } from "@/server/storage/media";

export const runtime = "nodejs";

/**
 * Baixa mídia do Storage e converte para data URL.
 * Se falhar (arquivo ausente), retorna null — o PDF simplesmente omite.
 */
async function toDataUrl(
  storagePath: string,
  mimeType: string,
): Promise<string | null> {
  const result = await downloadMedia(storagePath);
  if (!result.ok) return null;
  const base64 = result.data.toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return new Response("Não autenticado.", { status: 401 });
  }

  const { id } = await params;
  const workOrder = await getWorkOrder(user.companyId, id, {
    userId: user.id,
    role: user.role,
  });

  if (!workOrder) {
    return new Response("OS não encontrada.", { status: 404 });
  }

  // Baixa fotos do Storage (máx. 8) e converte para data URL
  const photoDataUrls = await Promise.all(
    workOrder.attachments.slice(0, 8).map(async (photo) => {
      const dataUrl = await toDataUrl(photo.storagePath, "image/jpeg");
      return dataUrl ? { id: photo.id, url: dataUrl, fileName: photo.fileName } : null;
    }),
  );

  // Baixa assinatura do Storage
  let signatureDataUrl: string | null = null;
  if (workOrder.execution?.signatureUrl) {
    signatureDataUrl = await toDataUrl(workOrder.execution.signatureUrl, "image/png");
  }

  const buffer = await renderWorkOrderPdf(
    workOrder,
    {
      name: user.companyName,
      logoUrl: user.companyLogoUrl,
    },
    {
      photos: photoDataUrls.filter((p): p is { id: string; url: string; fileName: string } => p !== null),
      signatureUrl: signatureDataUrl,
    },
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="OS-${workOrder.number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}