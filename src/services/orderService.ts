/**
 * services/orderService.ts
 * SQLite-backed order persistence (Round 2).
 * Payments are stored in their own table and joined into each Order on read.
 */

import { getDB } from './database';
import { computeBalance, computeProfit, roundCurrency } from '../utils/calculation';
import { normalizeDateForStorage } from '../utils/date';
import type { Order, OrderFormInput, PaymentRecord, PaymentType } from '../types/order';

function generateId(): string {
  return `order_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function generatePayId(): string {
  return `pay_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function rowToOrder(row: Record<string, unknown>, payments: PaymentRecord[]): Order {
  return {
    id: row.id as string,
    orderNo: row.orderNo as string,
    manualSO: (row.manualSO as string) ?? '',
    date: normalizeDateForStorage(row.date as string),
    deliveryDate: normalizeDateForStorage((row.deliveryDate as string) ?? ''),
    amount: row.amount as number,
    deposit: row.deposit as number,
    additionalDeposit: row.additionalDeposit as number,
    balance: row.balance as number,
    costing: row.costing as number,
    profit: row.profit as number,
    salesperson: (row.salesperson as string) ?? '',
    driver: (row.driver as string) ?? '',
    notes: (row.notes as string) ?? '',
    status: row.status as Order['status'],
    deliveryStatus: (row.deliveryStatus as Order['deliveryStatus']) ?? 'pending',
    paymentHistory: payments,
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string,
  };
}

function rowToPayment(row: Record<string, unknown>): PaymentRecord {
  return {
    id: row.id as string,
    orderId: row.orderId as string,
    type: row.type as PaymentType,
    amount: row.amount as number,
    recordedAt: row.recordedAt as string,
    note: (row.note as string) ?? '',
  };
}

export const orderService = {
  async getAll(): Promise<Order[]> {
    const db = await getDB();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM orders ORDER BY createdAt DESC',
    );
    const allPayments = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM payments ORDER BY recordedAt ASC',
    );
    return rows.map((row) =>
      rowToOrder(
        row,
        allPayments.filter((p) => p.orderId === row.id).map(rowToPayment),
      ),
    );
  },

  async getById(id: string): Promise<Order | null> {
    const db = await getDB();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM orders WHERE id = ?',
      [id],
    );
    if (!row) return null;
    const payments = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM payments WHERE orderId = ? ORDER BY recordedAt ASC',
      [id],
    );
    return rowToOrder(row, payments.map(rowToPayment));
  },

  async create(input: OrderFormInput): Promise<Order> {
    const db = await getDB();
    const now = new Date().toISOString();
    const id = generateId();
    const date = normalizeDateForStorage(input.date);
    const deliveryDate = normalizeDateForStorage(input.deliveryDate ?? '');
    const balance = roundCurrency(
      computeBalance(input.amount, input.deposit, input.additionalDeposit),
    );
    const profit = roundCurrency(computeProfit(input.amount, input.costing));
    const paymentHistory: PaymentRecord[] = [];

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO orders
          (id, orderNo, manualSO, date, deliveryDate, amount, deposit, additionalDeposit,
           balance, costing, profit, salesperson, driver, notes, status, deliveryStatus,
           createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, input.orderNo, input.manualSO ?? '', date, deliveryDate,
          input.amount, input.deposit, input.additionalDeposit, balance,
          input.costing, profit, input.salesperson, input.driver ?? '',
          input.notes ?? '', input.status, input.deliveryStatus ?? 'pending', now, now,
        ],
      );

      if (input.deposit > 0) {
        const payment: PaymentRecord = {
          id: generatePayId(),
          orderId: id,
          type: 'deposit',
          amount: input.deposit,
          recordedAt: now,
          note: 'Initial deposit',
        };
        paymentHistory.push(payment);
        await db.runAsync(
          'INSERT INTO payments (id, orderId, type, amount, recordedAt, note) VALUES (?, ?, ?, ?, ?, ?)',
          [payment.id, payment.orderId, payment.type, payment.amount, payment.recordedAt, payment.note ?? ''],
        );
      }

      if (input.additionalDeposit > 0) {
        const payment: PaymentRecord = {
          id: generatePayId(),
          orderId: id,
          type: 'additionalDeposit',
          amount: input.additionalDeposit,
          recordedAt: now,
          note: 'Initial additional deposit',
        };
        paymentHistory.push(payment);
        await db.runAsync(
          'INSERT INTO payments (id, orderId, type, amount, recordedAt, note) VALUES (?, ?, ?, ?, ?, ?)',
          [payment.id, payment.orderId, payment.type, payment.amount, payment.recordedAt, payment.note ?? ''],
        );
      }
    });

    return {
      ...input,
      id,
      date,
      deliveryDate,
      balance,
      profit,
      paymentHistory,
      createdAt: now,
      updatedAt: now,
    };
  },

  async update(id: string, patch: Partial<OrderFormInput>): Promise<Order | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const db = await getDB();
    const now = new Date().toISOString();
    const merged = {
      ...existing,
      ...patch,
      date: normalizeDateForStorage(patch.date ?? existing.date),
      deliveryDate: normalizeDateForStorage(patch.deliveryDate ?? existing.deliveryDate),
    };
    const balance = roundCurrency(
      computeBalance(merged.amount, merged.deposit, merged.additionalDeposit),
    );
    const profit = roundCurrency(computeProfit(merged.amount, merged.costing));

    await db.runAsync(
      `UPDATE orders SET
        orderNo=?, manualSO=?, date=?, deliveryDate=?, amount=?, deposit=?,
        additionalDeposit=?, balance=?, costing=?, profit=?, salesperson=?,
        driver=?, notes=?, status=?, deliveryStatus=?, updatedAt=?
       WHERE id=?`,
      [
        merged.orderNo, merged.manualSO ?? '', merged.date, merged.deliveryDate ?? '',
        merged.amount, merged.deposit, merged.additionalDeposit, balance,
        merged.costing, profit, merged.salesperson, merged.driver ?? '',
        merged.notes ?? '', merged.status, merged.deliveryStatus ?? 'pending', now, id,
      ],
    );

    return { ...merged, balance, profit, updatedAt: now };
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    // Cascades to payments via FK
    await db.runAsync('DELETE FROM orders WHERE id = ?', [id]);
  },

  async setDeliveryStatus(
    id: string,
    deliveryStatus: Order['deliveryStatus'],
  ): Promise<Order | null> {
    const db = await getDB();
    const now = new Date().toISOString();
    const orderStatus = deliveryStatus === 'delivered' ? 'delivered' : undefined;
    if (orderStatus) {
      await db.runAsync(
        'UPDATE orders SET deliveryStatus = ?, status = ?, updatedAt = ? WHERE id = ?',
        [deliveryStatus, orderStatus, now, id],
      );
    } else {
      await db.runAsync(
        'UPDATE orders SET deliveryStatus = ?, updatedAt = ? WHERE id = ?',
        [deliveryStatus, now, id],
      );
    }
    return this.getById(id);
  },

  /**
   * Records a payment entry AND updates the running deposit on the order.
   * This is the canonical way to add payments — avoids calling update() directly.
   */
  async addPayment(
    orderId: string,
    type: PaymentType,
    amount: number,
    note?: string,
  ): Promise<Order | null> {
    const existing = await this.getById(orderId);
    if (!existing) return null;

    const db = await getDB();
    const now = new Date().toISOString();
    const payId = generatePayId();

    const deposit = type === 'deposit' ? existing.deposit + amount : existing.deposit;
    const additionalDeposit =
      type === 'additionalDeposit'
        ? existing.additionalDeposit + amount
        : existing.additionalDeposit;
    const balance = roundCurrency(
      computeBalance(existing.amount, deposit, additionalDeposit),
    );

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        'INSERT INTO payments (id, orderId, type, amount, recordedAt, note) VALUES (?, ?, ?, ?, ?, ?)',
        [payId, orderId, type, amount, now, note ?? ''],
      );
      await db.runAsync(
        'UPDATE orders SET deposit = ?, additionalDeposit = ?, balance = ?, updatedAt = ? WHERE id = ?',
        [deposit, additionalDeposit, balance, now, orderId],
      );
    });

    return this.getById(orderId);
  },

  async getLastBMNumber(): Promise<number> {
    const db = await getDB();
    const row = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM meta WHERE key = ?',
      ['lastBMNumber'],
    );
    return row ? parseInt(row.value, 10) : 0;
  },

  async incrementBMNumber(): Promise<number> {
    const db = await getDB();
    const current = await this.getLastBMNumber();
    const next = current + 1;
    await db.runAsync(
      `INSERT INTO meta (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      ['lastBMNumber', String(next)],
    );
    return next;
  },
};
