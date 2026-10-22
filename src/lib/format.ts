const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

const dateOnlyFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return dateFormatter.format(toDate(value));
}

/** Para campos @db.Date (sem hora): evita deslocamento de fuso. */
export function formatDateOnly(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return dateOnlyFormatter.format(toDate(value));
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return dateTimeFormatter.format(toDate(value));
}

/** Converte "2026-10-22" em Date ao meio-dia de São Paulo (UTC-3). */
export function parseSaoPauloDate(value: string, hour = 12): Date {
  return new Date(`${value}T${String(hour).padStart(2, "0")}:00:00-03:00`);
}

export function toDateInput(value: Date | string | null | undefined): string {
  if (!value) return "";
  const date = toDate(value);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatMinutes(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return "—";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours} h`;
  return `${hours} h ${rest} min`;
}

export function formatQuantity(value: unknown): string {
  if (value === null || value === undefined) return "—";
  const number = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(number)) return "—";
  return number.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}
