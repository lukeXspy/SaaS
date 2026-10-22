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
}: {
  children: ReactNode;
  pendingText?: string;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant={variant} size={size} disabled={pending} className={className}>
      {pending ? <Loader2 aria-hidden className="animate-spin" /> : null}
      {pending ? pendingText : children}
    </Button>
  );
}
