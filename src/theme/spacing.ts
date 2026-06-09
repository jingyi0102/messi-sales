/**
 * spacing.ts
 * Consistent spacing scale used for padding, margin, and gap.
 * Based on a 4px base unit.
 */

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
} as const;

export type SpacingKey = keyof typeof spacing;
