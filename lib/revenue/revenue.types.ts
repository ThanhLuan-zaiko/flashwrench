// Revenue domain shapes shared by repository, service, routes and the
// client contract. All money is integer VND.
import type { RevenueRange } from "./revenue-period";

export type { RevenueRange };

export type RevenueSource = "booking" | "order" | "emergency";

/** Row shape of payments_by_period. */
export type PeriodPaymentRow = {
  bucket: string;
  paid_at: Date | null;
  payment_id: string;
  ref_type: string | null;
  ref_id: string | null;
  customer_id: string | null;
  mechanic_id: string | null;
  amount: number | null;
  method: string | null;
  status: string | null;
  recorded_by: string | null;
  customer_confirmed: boolean | null;
};

/** Write shape when a collection path confirms money in hand. */
export type ReceiptProjectionWrite = {
  paymentId: string;
  refType: RevenueSource;
  refId: string;
  customerId: string | null;
  mechanicId: string | null;
  recordedBy: string | null;
  customerConfirmed: boolean | null;
  amount: number;
  method: string;
  paidAt: Date;
};

export const PAYMENT_AUDIT_ACTIONS = [
  "recorded",
  "confirm_code_issued",
  "confirm_failed",
  "refund_marked",
] as const;
export type PaymentAuditAction = (typeof PAYMENT_AUDIT_ACTIONS)[number];

export type AuditEventWrite = {
  eventId: string;
  actorId: string | null;
  action: PaymentAuditAction;
  refType: RevenueSource;
  refId: string;
  paymentId: string | null;
  amount: number | null;
  method: string | null;
  detail: string | null;
  at: Date;
};

export type PaymentAuditRow = {
  bucket: string;
  event_at: Date | null;
  event_id: string;
  actor_id: string | null;
  action: string | null;
  ref_type: string | null;
  ref_id: string | null;
  payment_id: string | null;
  amount: number | null;
  method: string | null;
  detail: string | null;
};

/** One transaction line on the revenue screen and in the CSV export. */
export type RevenueTransaction = {
  paymentId: string;
  refType: RevenueSource;
  refId: string;
  customerId: string | null;
  mechanicId: string | null;
  recordedBy: string | null;
  amount: number;
  method: string | null;
  status: string | null;
  customerConfirmed: boolean | null;
  paidAt: string | null;
};

export type RevenueSlice = {
  key: string;
  amount: number;
  count: number;
};

export type RevenuePoint = {
  key: string;
  label: string;
  amount: number;
  count: number;
};

export type FraudFlagKind =
  | "unconfirmed-cod"
  | "collector-mismatch"
  | "cash-concentration"
  | "rapid-repeat";

export type FraudFlag = {
  kind: FraudFlagKind;
  severity: "warning" | "critical";
  refId: string | null;
  actorId: string | null;
  detail: string;
};

export type RevenueReport = {
  range: RevenueRange;
  anchor: string;
  label: string;
  timeZone: string;
  collected: number;
  receipts: number;
  avgReceipt: number;
  previous: {
    collected: number;
    delta: number;
    /** Percent change vs the previous range; null when it had no revenue. */
    percent: number | null;
  };
  series: RevenuePoint[];
  bySource: RevenueSlice[];
  byMethod: RevenueSlice[];
  /** Admin only: revenue grouped by the mechanic tied to the receipt. */
  byMechanic: RevenueSlice[] | null;
  /** Admin only: heuristic anti-bribery flags on the range's receipts. */
  flags: FraudFlag[] | null;
  transactions: RevenueTransaction[];
  /** True when the range hit the row cap; the report is partial. */
  truncated: boolean;
};

export type PaymentAuditEvent = {
  eventId: string;
  at: string | null;
  actorId: string | null;
  action: string | null;
  refType: string | null;
  refId: string | null;
  paymentId: string | null;
  amount: number | null;
  method: string | null;
  detail: string | null;
};
