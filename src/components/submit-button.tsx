"use client";

import type { ComponentProps, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

export function SubmitButton({
  children,
  pendingText = "Salvando…",
  variant,
  size = "lg",
  className,
  disabled,
}: {
  children: ReactNode;
  pendingText?: string;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      disabled={pending || disabled}
      aria-busy={pending || undefined}
      className={className}
    >
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 aria-hidden className="size-4 animate-spin" />
          {pendingText}
        </span>
      ) : (
        children
      )}
    </Button>
  );
}