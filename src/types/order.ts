/**
 * types/order.ts
 * Core domain types for the order system.
 * All business logic must work against these interfaces — never against raw objects.
 */

// ── Status ────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'draft'         // Created but not yet confirmed
  | 'confirmed'     // Order confirmed, awaiting delivery
  | 'partial'       // Partially paid, delivery pending or done
  | 'delivered'     // Physically delivered
  | 'paid'          // Fully paid
  | 'cancelled';    // Cancelled

export type DeliveryStatus =
  | 'pending'
  | 'out_for_delivery'
  | 'delivered';

// ── Payment ───────────────────────────────────────────────────────────

export type PaymentType = 'deposit' | 'additionalDeposit';

export interface PaymentRecord {
  id: string;
  orderId: string;
  type: PaymentType;
  amount: number;
  recordedAt: string;       // ISO 8601
  note?: string;
}

// ── People ────────────────────────────────────────────────────────────

export interface Salesperson {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface Driver {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

// ── Order ─────────────────────────────────────────────────────────────

export interface Order {
  id: string;
  orderNo: string;          // e.g. "BM 0042" — user-editable
  manualSO: string;         // Optional manual sales order reference
  date: string;             // ISO 8601 date string (YYYY-MM-DD)
  amount: number;
  deposit: number;
  additionalDeposit: number;
  balance: number;          // Computed: amount - deposit - additionalDeposit
  costing: number;
  profit: number;           // Computed: amount - costing
  salesperson: string;      // Name string (FK to Salesperson in future)
  driver: string;           // Name string (FK to Driver in future)
  deliveryDate: string;     // ISO 8601 date string
  notes: string;
  status: OrderStatus;
  deliveryStatus: DeliveryStatus;
  paymentHistory: PaymentRecord[];
  createdAt: string;        // ISO 8601
  updatedAt: string;        // ISO 8601
}

// ── Form / Input ──────────────────────────────────────────────────────

/**
 * Used when creating or editing an order via the form.
 * Omits computed fields (balance, profit) and system fields (id, createdAt, updatedAt).
 */
export type OrderFormInput = Omit<
  Order,
  'id' | 'balance' | 'profit' | 'paymentHistory' | 'createdAt' | 'updatedAt'
>;

// ── Summary ───────────────────────────────────────────────────────────

export interface MonthlySummary {
  monthKey: string;         // e.g. "04-2025"
  totalSales: number;
  totalCost: number;
  totalProfit: number;
  totalOutstanding: number;
  orderCount: number;
  bysalesperson: SalespersonSummary[];
}

export interface SalespersonSummary {
  name: string;
  totalSales: number;
  totalProfit: number;
  orderCount: number;
}
