/**
 * Date-only helpers for DB `date` columns (e.g. "2026-06-12").
 *
 * `new Date("2026-06-12")` is parsed as UTC midnight, which renders as the
 * previous day in US timezones. These helpers parse and format date-only
 * strings entirely in LOCAL time so a stored date round-trips unchanged.
 *
 * Use these ONLY for date-only fields (target_date, scheduled_date,
 * meeting_date, ...). Full timestamps (created_at, decided_at, timestamptz)
 * should still be parsed with `new Date(value)`.
 */

/**
 * Parse a "yyyy-MM-dd" string (or a full ISO timestamp, from which only the
 * date part is taken) into a Date at LOCAL midnight.
 *
 * Callers should guard falsy input themselves (e.g. `s ? parseDateOnly(s) :
 * undefined`); passing a falsy or malformed string returns an Invalid Date.
 */
export function parseDateOnly(s: string): Date {
  if (!s) return new Date(NaN);
  const datePart = s.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  if (!match) return new Date(NaN);
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d));
}

/** Format a Date as local "yyyy-MM-dd". */
export function formatDateOnly(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
