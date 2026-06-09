/**
 * radius.ts
 * Border radius tokens for consistent rounded corners.
 */

export const radius = {
  xs: 4,
  sm: 8,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
} as const;

export type RadiusKey = keyof typeof radius;
