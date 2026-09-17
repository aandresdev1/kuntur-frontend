const MONTHS_ES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "set",
  "oct",
  "nov",
  "dic",
] as const;

// Formats an ISO date (YYYY-MM-DD) as "24 jul 2026".
export function formatIsoDateEs(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return `${d.getDate()} ${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`;
}

// Days between an ISO date and a reference date (defaults to today).
export function daysUntil(iso: string, reference: Date = new Date()): number {
  const target = new Date(iso + "T00:00:00").getTime();
  const ref = new Date(
    reference.getFullYear(),
    reference.getMonth(),
    reference.getDate(),
  ).getTime();
  return Math.round((target - ref) / 86400000);
}
