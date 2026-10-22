export function FormMessage({ error, success }: { error?: string; success?: string }) {
  if (error) {
    return (
      <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {error}
      </p>
    );
  }
  if (success) {
    return (
      <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
        {success}
      </p>
    );
  }
  return null;
}
