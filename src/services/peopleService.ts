/**
 * services/peopleService.ts
 * SQLite-backed salespeople and driver management (Round 2).
 */

import { getDB } from './database';
import { DEFAULT_SALESPEOPLE, DEFAULT_DRIVERS } from '../constants';
import type { Salesperson, Driver } from '../types/order';

function makeId(): string {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export const peopleService = {
  // ── Salespeople ────────────────────────────────────────────────────────

  async getSalespeople(): Promise<Salesperson[]> {
    const db = await getDB();
    let rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM salespeople WHERE isActive = 1 ORDER BY createdAt ASC',
    );

    if (rows.length === 0) {
      const now = new Date().toISOString();
      for (const name of DEFAULT_SALESPEOPLE) {
        await db.runAsync(
          'INSERT INTO salespeople (id, name, isActive, createdAt) VALUES (?, ?, 1, ?)',
          [makeId(), name, now],
        );
      }
      rows = await db.getAllAsync<Record<string, unknown>>(
        'SELECT * FROM salespeople WHERE isActive = 1 ORDER BY createdAt ASC',
      );
    }

    return rows.map((r) => ({
      id: r.id as string,
      name: r.name as string,
      isActive: Boolean(r.isActive),
      createdAt: r.createdAt as string,
    }));
  },

  async addSalesperson(name: string): Promise<Salesperson> {
    const db = await getDB();
    const id = makeId();
    const now = new Date().toISOString();
    await db.runAsync(
      'INSERT INTO salespeople (id, name, isActive, createdAt) VALUES (?, ?, 1, ?)',
      [id, name, now],
    );
    return { id, name, isActive: true, createdAt: now };
  },

  async removeSalesperson(id: string): Promise<void> {
    const db = await getDB();
    await db.runAsync('DELETE FROM salespeople WHERE id = ?', [id]);
  },

  // ── Drivers ────────────────────────────────────────────────────────────

  async getDrivers(): Promise<Driver[]> {
    const db = await getDB();
    let rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM drivers WHERE isActive = 1 ORDER BY createdAt ASC',
    );

    if (rows.length === 0) {
      const now = new Date().toISOString();
      for (const name of DEFAULT_DRIVERS) {
        await db.runAsync(
          'INSERT INTO drivers (id, name, isActive, createdAt) VALUES (?, ?, 1, ?)',
          [makeId(), name, now],
        );
      }
      rows = await db.getAllAsync<Record<string, unknown>>(
        'SELECT * FROM drivers WHERE isActive = 1 ORDER BY createdAt ASC',
      );
    }

    return rows.map((r) => ({
      id: r.id as string,
      name: r.name as string,
      isActive: Boolean(r.isActive),
      createdAt: r.createdAt as string,
    }));
  },

  async addDriver(name: string): Promise<Driver> {
    const db = await getDB();
    const id = makeId();
    const now = new Date().toISOString();
    await db.runAsync(
      'INSERT INTO drivers (id, name, isActive, createdAt) VALUES (?, ?, 1, ?)',
      [id, name, now],
    );
    return { id, name, isActive: true, createdAt: now };
  },

  async removeDriver(id: string): Promise<void> {
    const db = await getDB();
    await db.runAsync('DELETE FROM drivers WHERE id = ?', [id]);
  },
};
