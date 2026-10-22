export function FieldError({
  errors,
  className,
}: {
  errors?: string[];
  className?: string;
}) {
  if (!errors?.length) return null;
  return (
    <p className={["text-sm text-destructive", className].filter(Boolean).join(" ")}>{errors[0]}</p>
  );
}
