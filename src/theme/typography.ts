/**
 * typography.ts
 * Font sizes, weights, and line heights.
 * iOS system font (-apple-system) is used by default via React Native.
 */

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 22,
  xxxl: 28,
  display: 34,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
  black: '900' as const,
};

export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
} as const;

export const letterSpacing = {
  tight: -0.3,
  normal: 0,
  wide: 0.5,
  wider: 1.0,
} as const;
