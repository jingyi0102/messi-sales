/**
 * utils/date.ts
 * Date parsing, formatting, and comparison helpers.
 * All dates in the data layer are stored as ISO 8601 strings (YYYY-MM-DD).
 * Display formatting is handled at the UI edge.
 */

/**
 * Return today's date as an ISO string. e.g. "2025-04-20"
 */
export function todayISO(): string {
  const d = new Date();
  return toISO(d);
}

/**
 * Convert a Date to ISO string (YYYY-MM-DD).
 */
export function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Convert ISO string to display format.
 * e.g. "2025-04-20" → "20.04.25"
 */
export function isoToDisplay(iso: string): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length < 3) return iso;
  return `${parts[2]}.${parts[1]}.${parts[0].slice(-2)}`;
}

/**
 * Convert display string to ISO.
 * e.g. "20.04.25" → "2025-04-20"
 */
export function displayToISO(display: string): string {
  if (!display) return '';
  if (display.includes('-')) return display;
  const parts = display.split('.');
  if (parts.length < 3) return display;
  let year = parts[2];
  if (year.length === 2) year = '20' + year;
  return `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
}

/**
 * Normalize either ISO or display dates to ISO for storage.
 */
export function normalizeDateForStorage(value: string): string {
  if (!value) return '';
  return value.includes('.') ? displayToISO(value) : value;
}

/**
 * Format either storage or legacy display date for screen output.
 */
export function formatDateDisplay(value: string): string {
  if (!value) return '';
  return value.includes('-') ? isoToDisplay(value) : value;
}

/**
 * Derive the month key from a date string.
 * Accepts either ISO ("2025-04-20") or display ("20.04.25") format.
 * Returns "MM-YYYY" e.g. "04-2025"
 */
export function getMonthKey(dateStr: string): string {
  if (!dateStr) return currentMonthKey();
  const iso = normalizeDateForStorage(dateStr);
  const parts = iso.split('-');
  if (parts.length < 2) return currentMonthKey();
  return `${parts[1]}-${parts[0]}`;
}

/**
 * Return current month key. e.g. "04-2025"
 */
export function currentMonthKey(): string {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

/**
 * Convert a month key to a human label.
 * e.g. "04-2025" → "Apr 2025"
 */
export function monthKeyToLabel(key: string): string {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const parts = key.split('-');
  if (parts.length < 2) return key;
  const monthIndex = parseInt(parts[0], 10) - 1;
  return `${months[monthIndex]} ${parts[1]}`;
}

/**
 * Return all unique month keys found in a list of date strings, sorted descending.
 * Always includes the current month.
 */
export function extractMonthKeys(dates: string[]): string[] {
  const keys = new Set<string>(dates.map(getMonthKey));
  keys.add(currentMonthKey());
  return [...keys].sort().reverse();
}
