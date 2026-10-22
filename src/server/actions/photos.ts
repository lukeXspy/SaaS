"use server";

import { revalidatePath } from "next/cache";

import { photoBatchSchema, photoTargetSchema } from "@/lib/validation/photos";
import { requireUser } from "@/server/auth/session";
import { addPhotos, deletePhoto } from "@/server/services/photos";
import { formText, type ActionState } from "./state";

export async function uploadPhotosAction(input: {
  target: unknown;
  photos: unknown;
}): Promise<ActionState> {
  const target = photoTargetSchema.safeParse(input.target);
  if (!target.success) {
    return { error: target.error.issues[0]?.message ?? "Destino da foto inválido." };
  }

  const photos = photoBatchSchema.safeParse(input.photos);
  if (!photos.success) {
    return { error: photos.error.issues[0]?.message ?? "Fotos inválidas." };
  }

  const user = await requireUser();
  let result;
  try {
    result = await addPhotos(
      user.companyId,
      { userId: user.id, role: user.role },
      target.data,
      photos.data,
    );
  } catch (error) {
    console.error("uploadPhotosAction", error);
    return { error: "Não foi possível salvar as fotos. Tente novamente." };
  }
  if (!result.ok) return { error: result.error };

  revalidatePath("/campo", "layout");
  revalidatePath("/app", "layout");
  return { success: "Fotos anexadas." };
}

export async function deletePhotoAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = formText(formData, "id");
  if (!id) return { error: "Foto não encontrada." };

  const user = await requireUser();
  const result = await deletePhoto(user.companyId, { userId: user.id, role: user.role }, id);
  if (!result.ok) return { error: result.error };

  revalidatePath("/campo", "layout");
  revalidatePath("/app", "layout");
  return { success: "Foto removida." };
}
