import { getSessionUser } from "@/server/auth/session";
import { renderWorkOrderPdf } from "@/server/pdf/work-order-pdf";
import { getWorkOrder } from "@/server/services/work-orders";

export const runtime = "nodejs";

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

  const buffer = await renderWorkOrderPdf(workOrder, {
    name: user.companyName,
    logoUrl: user.companyLogoUrl,
  });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="OS-${workOrder.number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
