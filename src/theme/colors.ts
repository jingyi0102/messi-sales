/**
 * colors.ts
 * Single source of truth for all colors.
 * Screens and components must never hard-code hex values — import from here.
 */

export const palette = {
  // Brand
  blue50: '#EFF6FF',
  blue100: '#DBEAFE',
  blue300: '#93C5FD',
  blue400: '#60A5FA',
  blue500: '#3B82F6',
  blue600: '#2563EB',
  blue700: '#1D4ED8',

  // Neutral
  white: '#FFFFFF',
  gray50: '#F8FAFC',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1E293B',
  gray900: '#0F172A',

  // Semantic
  green400: '#34D399',
  green500: '#10B981',
  green600: '#059669',
  green100: '#D1FAE5',

  amber400: '#FBBF24',
  amber500: '#F59E0B',
  amber600: '#D97706',
  amber100: '#FEF3C7',

  red400: '#F87171',
  red500: '#EF4444',
  red600: '#DC2626',
  red100: '#FEE2E2',

  // Always transparent
  transparent: 'transparent',
} as const;

export const colors = {
  // Backgrounds
  background: palette.gray50,
  surface: palette.white,
  surfaceSecondary: palette.gray100,
  surfaceHighlight: palette.blue50,

  // Text
  textPrimary: palette.gray800,
  textSecondary: palette.gray500,
  textMuted: palette.gray400,
  textInverse: palette.white,
  textLink: palette.blue500,

  // Brand
  primary: palette.blue500,
  primaryActive: palette.blue600,
  primaryLight: palette.blue100,

  // Borders
  border: palette.gray200,
  borderFocus: palette.blue400,
  borderStrong: palette.gray300,

  // Status
  success: palette.green600,
  successLight: palette.green100,
  warning: palette.amber600,
  warningLight: palette.amber100,
  danger: palette.red600,
  dangerLight: palette.red100,

  // Navigation
  tabActive: palette.blue500,
  tabInactive: palette.gray400,
  tabBackground: palette.white,

  // Overlays
  overlay: 'rgba(15, 23, 42, 0.5)',
} as const;

export type ColorKey = keyof typeof colors;
