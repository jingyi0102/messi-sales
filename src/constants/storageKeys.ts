/**
 * constants/storageKeys.ts
 * All AsyncStorage (and future SQLite table) keys in one place.
 * Never hard-code storage key strings in components or screens.
 */

export const STORAGE_KEYS = {
  // Core data
  ORDERS: '@messi/orders',
  SALESPEOPLE: '@messi/salespeople',
  DRIVERS: '@messi/drivers',
  LAST_BM_NUMBER: '@messi/lastBMNumber',

  // Settings / preferences
  APP_SETTINGS: '@messi/appSettings',
  SELECTED_MONTH: '@messi/selectedMonth',

  // Future: auth / session
  AUTH_TOKEN: '@messi/authToken',
  USER_PROFILE: '@messi/userProfile',

  // Future: delivery
  DELIVERY_QUEUE: '@messi/deliveryQueue',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
