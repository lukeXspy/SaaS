"use client";

import { Camera, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent } from "react";

import { Button } from "@/components/ui/button";
import { uploadPhotosAction } from "@/server/actions/photos";
import type { ActionState } from "@/server/actions/state";

type Target = {
  workOrderId?: string;
  inspectionResponseId?: string;
  assetId?: string;
};

type PhotoPayload = {
  dataUrl: string;
  fileName: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  sizeBytes: number;
  width: number;
  height: number;
};

const MAX_DATA_URL = 540_000;
const MAX_FILES = 5;

async function compress(file: File): Promise<PhotoPayload | null> {
  if (!file.type.startsWith("image/")) return null;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return null;
  }

  try {
    let maxSide = 1600;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(bitmap, 0, 0, width, height);

      let quality = 0.78;
      let dataUrl = canvas.toDataURL("image/jpeg", quality);
      while (dataUrl.length > MAX_DATA_URL && quality > 0.44) {
        quality -= 0.08;
        dataUrl = canvas.toDataURL("image/jpeg", quality);
      }

      if (dataUrl.length <= MAX_DATA_URL) {
        const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
        return {
          dataUrl,
          fileName: `${file.name.replace(/\.[^.]+$/, "") || "foto"}.jpg`.slice(0, 160),
          mimeType: "image/jpeg",
          sizeBytes: Math.max(1, Math.round((base64.length * 3) / 4)),
          width,
          height,
        };
      }

      maxSide = Math.round(maxSide * 0.72);
    }
    return null;
  } finally {
    bitmap.close();
  }
}

export function PhotoUploader({
  target,
  disabled = false,
  hint = "Até 8 fotos por registro.",
}: {
  target: Target;
  disabled?: boolean;
  hint?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ActionState>({});
  const [pending, setPending] = useState(false);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, MAX_FILES);
    if (files.length === 0) return;

    setPending(true);
    setState({});

    const photos: PhotoPayload[] = [];
    for (const file of files) {
      const photo = await compress(file);
      if (photo) photos.push(photo);
    }

    if (photos.length === 0) {
      setState({ error: "Não foi possível processar as fotos selecionadas." });
      setPending(false);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    const result = await uploadPhotosAction({ target, photos }).catch((e) => {
      console.error(e);
      return { error: "Não foi possível enviar as fotos. Tente novamente." } as const;
    });
    setState(result);
    setPending(false);
    if (inputRef.current) inputRef.current.value = "";
    if ("success" in result && result.success) router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          id={`photos-${target.workOrderId ?? target.inspectionResponseId ?? target.assetId}`}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          disabled={disabled || pending}
          onChange={handleChange}
          className="sr-only"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || pending}
          onClick={() => inputRef.current?.click()}
        >
          {pending ? <Loader2 aria-hidden className="animate-spin" /> : <Camera aria-hidden />}
          {pending ? "Enviando…" : "Adicionar fotos"}
        </Button>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
