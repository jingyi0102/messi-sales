import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDB } from './database';
import type { Account, CreateAccountInput, UserRole } from '../types/auth';

const SESSION_KEY = '@messi_sales/current_account_id';

function makeId(): string {
  return `account_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// Local-only password digest. A cloud version should use server-side Argon2/bcrypt.
function passwordDigest(password: string): string {
  let hash = 2166136261;
  for (let index = 0; index < password.length; index += 1) {
    hash ^= password.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `local_${(hash >>> 0).toString(16)}`;
}

function rowToAccount(row: Record<string, unknown>): Account {
  return {
    id: row.id as string,
    username: row.username as string,
    displayName: row.displayName as string,
    role: row.role as UserRole,
    isActive: Boolean(row.isActive),
    createdAt: row.createdAt as string,
    lastLoginAt: (row.lastLoginAt as string) ?? '',
  };
}

export const authService = {
  async ensureDefaultAdmin(): Promise<void> {
    const db = await getDB();
    const row = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM accounts',
    );
    if ((row?.count ?? 0) > 0) return;

    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO accounts
        (id, username, passwordHash, displayName, role, isActive, createdAt, lastLoginAt)
       VALUES (?, ?, ?, ?, ?, 1, ?, '')`,
      [makeId(), 'admin', passwordDigest('admin123'), 'ADMIN', 'admin', now],
    );
  },

  async login(username: string, password: string): Promise<Account | null> {
    const db = await getDB();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      `SELECT * FROM accounts
       WHERE username = ? COLLATE NOCASE AND passwordHash = ? AND isActive = 1`,
      [username.trim(), passwordDigest(password)],
    );
    if (!row) return null;

    const now = new Date().toISOString();
    await db.runAsync('UPDATE accounts SET lastLoginAt = ? WHERE id = ?', [
      now,
      row.id as string,
    ]);
    await AsyncStorage.setItem(SESSION_KEY, row.id as string);
    return rowToAccount({ ...row, lastLoginAt: now });
  },

  async restoreSession(): Promise<Account | null> {
    const accountId = await AsyncStorage.getItem(SESSION_KEY);
    if (!accountId) return null;
    const db = await getDB();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM accounts WHERE id = ? AND isActive = 1',
      [accountId],
    );
    if (!row) {
      await AsyncStorage.removeItem(SESSION_KEY);
      return null;
    }
    return rowToAccount(row);
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem(SESSION_KEY);
  },

  async getAccounts(): Promise<Account[]> {
    const db = await getDB();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM accounts ORDER BY isActive DESC, displayName ASC',
    );
    return rows.map(rowToAccount);
  },

  async createAccount(input: CreateAccountInput): Promise<Account> {
    const db = await getDB();
    const id = makeId();
    const now = new Date().toISOString();
    const username = input.username.trim().toLowerCase();
    const displayName = input.displayName.trim().toUpperCase();
    await db.runAsync(
      `INSERT INTO accounts
        (id, username, passwordHash, displayName, role, isActive, createdAt, lastLoginAt)
       VALUES (?, ?, ?, ?, ?, 1, ?, '')`,
      [
        id,
        username,
        passwordDigest(input.password),
        displayName,
        input.role,
        now,
      ],
    );
    return {
      id,
      username,
      displayName,
      role: input.role,
      isActive: true,
      createdAt: now,
      lastLoginAt: '',
    };
  },

  async setActive(id: string, isActive: boolean): Promise<void> {
    const db = await getDB();
    await db.runAsync('UPDATE accounts SET isActive = ? WHERE id = ?', [
      isActive ? 1 : 0,
      id,
    ]);
  },

  async resetPassword(id: string, password: string): Promise<void> {
    const db = await getDB();
    await db.runAsync('UPDATE accounts SET passwordHash = ? WHERE id = ?', [
      passwordDigest(password),
      id,
    ]);
  },
};
