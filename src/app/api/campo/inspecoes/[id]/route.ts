import { getSessionUser } from "@/server/auth/session";
import { getInspection } from "@/server/services/inspections";
import { resolveAttachmentUrls } from "@/server/storage/resolve";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return new Response("Não autenticado.", { status: 401 });
  }

  const { id } = await params;
  const inspection = await getInspection(user.companyId, id);

  if (!inspection) {
    return new Response("Inspeção não encontrada.", { status: 404 });
  }

  // Isolamento: técnico só vê inspeções atribuídas a ele
  if (user.role === "TECHNICIAN" && inspection.technicianId !== user.id) {
    return new Response("Inspeção não encontrada.", { status: 404 });
  }

  // Resolve URLs assinadas para fotos de cada resposta
  const resolvedResponses = await Promise.all(
    inspection.responses.map(async (r) => ({
      ...r,
      attachments: await resolveAttachmentUrls(r.attachments),
    })),
  );

  // Resolve URLs assinadas para anexos gerais da inspeção
  const resolvedAttachments = await resolveAttachmentUrls(inspection.attachments);

  return Response.json({
    ...inspection,
    responses: resolvedResponses,
    attachments: resolvedAttachments,
    user: { id: user.id, role: user.role },
  });
}