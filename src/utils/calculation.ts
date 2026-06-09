/**
 * utils/calculation.ts
 * Pure financial calculation helpers.
 * These are intentionally side-effect-free so they can be unit tested easily.
 */

import type { Order, MonthlySummary, SalespersonSummary } from '../types/order';

/**
 * Compute balance from order financials.
 */
export function computeBalance(
  amount: number,
  deposit: number,
  additionalDeposit: number,
): number {
  return amount - deposit - additionalDeposit;
}

/**
 * Compute profit from amount and costing.
 */
export function computeProfit(amount: number, costing: number): number {
  return amount - costing;
}

/**
 * Round a financial value to 2 decimal places.
 */
export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Summarise a list of orders into monthly totals.
 */
export function summariseOrders(orders: Order[]): MonthlySummary {
  const totalSales = orders.reduce((sum, o) => sum + o.amount, 0);
  const totalCost = orders.reduce((sum, o) => sum + o.costing, 0);
  const totalProfit = orders.reduce((sum, o) => sum + o.profit, 0);
  const totalOutstanding = orders.reduce((sum, o) => sum + o.balance, 0);

  // Group by salesperson
  const spMap = new Map<string, SalespersonSummary>();
  orders.forEach((o) => {
    const name = o.salesperson || 'Unknown';
    const existing = spMap.get(name) ?? {
      name,
      totalSales: 0,
      totalProfit: 0,
      orderCount: 0,
    };
    spMap.set(name, {
      name,
      totalSales: existing.totalSales + o.amount,
      totalProfit: existing.totalProfit + o.profit,
      orderCount: existing.orderCount + 1,
    });
  });

  return {
    monthKey: '',           // Filled by caller
    totalSales,
    totalCost,
    totalProfit,
    totalOutstanding,
    orderCount: orders.length,
    bysalesperson: [...spMap.values()].sort((a, b) => b.totalSales - a.totalSales),
  };
}
