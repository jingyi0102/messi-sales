/**
 * services/storage.ts
 * Thin wrapper around AsyncStorage.
 * All persistence goes through this service — screens never call AsyncStorage directly.
 * EXTENSION POINT: swap the implementation for SQLite without touching any screen.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (raw == null) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {
      // TODO: surface errors via an error reporting service
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch {}
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch {}
  },
};
