/**
 * utils/format.ts
 * Number, currency, and string formatting helpers.
 * All display formatting must go through these functions — never inline formatting in components.
 */

/**
 * Format a number as a localised currency string.
 * e.g. 12345.6 → "12,345.60"
 */
export function formatAmount(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '—';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Short amount — no decimals for whole numbers.
 * e.g. 12345 → "12,345"  |  12345.5 → "12,345.5"
 */
export function formatAmountShort(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '—';
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

/**
 * Format a BM order number.
 * e.g. 42 → "BM 0042"
 */
export function formatBMNumber(seq: number): string {
  return `BM ${String(seq).padStart(4, '0')}`;
}

/**
 * Extract the numeric portion from a BM string.
 * e.g. "BM 0042" → 42
 */
export function parseBMNumber(bm: string): number {
  const match = bm.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

/**
 * Truncate a string with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + '…';
}
