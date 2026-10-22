"use client";

import { Eraser } from "lucide-react";
import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { Button } from "@/components/ui/button";

export function SignaturePad({
  onChange,
  error,
}: {
  onChange: (dataUrl: string) => void;
  error?: string[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  function context() {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a";
    return ctx;
  }

  function point(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function handleDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    event.preventDefault();
    const ctx = context();
    if (!ctx) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      // Eventos sintéticos/testes podem não ter captura de ponteiro ativa.
    }
    drawing.current = true;
    const { x, y } = point(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function handleMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = context();
    if (!ctx) return;

    event.preventDefault();
    const { x, y } = point(event);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function handleUp(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    drawing.current = false;

    const canvas = canvasRef.current;
    if (canvas?.hasPointerCapture(event.pointerId)) {
      try {
        canvas.releasePointerCapture(event.pointerId);
      } catch {
        // Ignora falha de captura em eventos sintéticos.
      }
    }

    const dataUrl = canvas?.toDataURL("image/png") ?? "";
    setHasInk(true);
    onChange(dataUrl);
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
    onChange("");
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-xl border bg-white p-1">
        <canvas
          ref={canvasRef}
          width={640}
          height={220}
          onPointerDown={handleDown}
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          onPointerCancel={handleUp}
          aria-label="Área de assinatura"
          role="img"
          className="h-40 w-full touch-none rounded-lg"
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {hasInk ? "Assinatura capturada." : "Assine com o dedo ou com o mouse."}
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={clear}>
          <Eraser aria-hidden />
          Limpar
        </Button>
      </div>

      {error?.length ? (
        <p role="alert" className="text-sm text-destructive">
          {error[0]}
        </p>
      ) : null}
    </div>
  );
}
