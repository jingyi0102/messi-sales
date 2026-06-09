/**
 * services/database.ts
 * SQLite singleton. All services call getDB() — schema is initialised once on first open.
 * PRAGMA foreign_keys is re-applied every open since it doesn't survive across connections.
 */

import * as SQLite from 'expo-sqlite';
import { normalizeDateForStorage } from '../utils/date';

let _db: SQLite.SQLiteDatabase | null = null;
let _dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  if (_dbPromise) return _dbPromise;

  _dbPromise = (async () => {
    const db = await SQLite.openDatabaseAsync('messi_sales.db');
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await db.execAsync('PRAGMA foreign_keys = ON;');
    await initSchema(db);
    _db = db;
    return db;
  })();

  try {
    return await _dbPromise;
  } catch (error) {
    _dbPromise = null;
    throw error;
  }
}

async function initSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS orders (
      id              TEXT PRIMARY KEY,
      orderNo         TEXT NOT NULL,
      manualSO        TEXT DEFAULT '',
      date            TEXT NOT NULL,
      deliveryDate    TEXT DEFAULT '',
      amount          REAL DEFAULT 0,
      deposit         REAL DEFAULT 0,
      additionalDeposit REAL DEFAULT 0,
      balance         REAL DEFAULT 0,
      costing         REAL DEFAULT 0,
      profit          REAL DEFAULT 0,
      salesperson     TEXT DEFAULT '',
      driver          TEXT DEFAULT '',
      notes           TEXT DEFAULT '',
      status          TEXT DEFAULT 'confirmed',
      deliveryStatus  TEXT DEFAULT 'pending',
      createdAt       TEXT NOT NULL,
      updatedAt       TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS payments (
      id          TEXT PRIMARY KEY,
      orderId     TEXT NOT NULL,
      type        TEXT NOT NULL,
      amount      REAL NOT NULL,
      recordedAt  TEXT NOT NULL,
      note        TEXT DEFAULT '',
      FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS salespeople (
      id        TEXT PRIMARY KEY,
      name      TEXT NOT NULL,
      isActive  INTEGER DEFAULT 1,
      createdAt TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS drivers (
      id        TEXT PRIMARY KEY,
      name      TEXT NOT NULL,
      isActive  INTEGER DEFAULT 1,
      createdAt TEXT NOT NULL
    );
  `);

  // Key-value store for app-level counters/settings
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS accounts (
      id           TEXT PRIMARY KEY,
      username     TEXT NOT NULL UNIQUE COLLATE NOCASE,
      passwordHash TEXT NOT NULL,
      displayName  TEXT NOT NULL,
      role         TEXT NOT NULL,
      isActive     INTEGER DEFAULT 1,
      createdAt    TEXT NOT NULL,
      lastLoginAt  TEXT DEFAULT ''
    );
  `);

  const orderColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(orders)');
  if (!orderColumns.some((column) => column.name === 'deliveryStatus')) {
    await db.execAsync(
      "ALTER TABLE orders ADD COLUMN deliveryStatus TEXT DEFAULT 'pending';",
    );
  }

  await migrateLegacyDisplayDates(db);
}

async function migrateLegacyDisplayDates(db: SQLite.SQLiteDatabase): Promise<void> {
  const rows = await db.getAllAsync<{ id: string; date: string; deliveryDate: string }>(
    'SELECT id, date, deliveryDate FROM orders',
  );

  for (const row of rows) {
    const date = normalizeDateForStorage(row.date);
    const deliveryDate = normalizeDateForStorage(row.deliveryDate);
    if (date !== row.date || deliveryDate !== row.deliveryDate) {
      await db.runAsync(
        'UPDATE orders SET date = ?, deliveryDate = ? WHERE id = ?',
        [date, deliveryDate, row.id],
      );
    }
  }
}
