// Raw CQL for voucher auto-grant rules, the per-rule grant ledger and the
// per-customer activity rollup. No business logic here.
import { scylla } from "@/lib/db/client";
import type { AutoRuleRow, CustomerStatsRow } from "./auto-rule.types";

function toRuleRow(raw: Record<string, unknown>): AutoRuleRow {
  return {
    rule_id: String(raw.rule_id),
    name: (raw.name as string | null) ?? null,
    campaign_id: raw.campaign_id ? String(raw.campaign_id) : null,
    trigger_type: (raw.trigger_type as string | null) ?? null,
    threshold:
      raw.threshold === null || raw.threshold === undefined
        ? null
        : Number(raw.threshold),
    window_days: (raw.window_days as number | null) ?? null,
    is_active: (raw.is_active as boolean | null) ?? null,
    granted_count: (raw.granted_count as number | null) ?? null,
    created_by: raw.created_by ? String(raw.created_by) : null,
    created_at: (raw.created_at as Date | null) ?? null,
    updated_at: (raw.updated_at as Date | null) ?? null,
  };
}

const RULE_COLUMNS =
  "rule_id, name, campaign_id, trigger_type, threshold, window_days, is_active, granted_count, created_by, created_at, updated_at";

// The rules table is a small staff-managed config set, so a full scan is
// the intended read (same pattern as listCampaignRows).
export async function listAutoRuleRows(): Promise<AutoRuleRow[]> {
  const result = await scylla.execute(
    `SELECT ${RULE_COLUMNS} FROM voucher_auto_rules_by_id`,
    [],
    { prepare: true },
  );
  return result.rows.map((row) =>
    toRuleRow(row as unknown as Record<string, unknown>),
  );
}

export async function findAutoRuleRowById(
  ruleId: string,
): Promise<AutoRuleRow | null> {
  const result = await scylla.execute(
    `SELECT ${RULE_COLUMNS} FROM voucher_auto_rules_by_id WHERE rule_id = ?`,
    [ruleId],
    { prepare: true },
  );
  const row = result.first() as unknown as Record<string, unknown> | null;
  return row ? toRuleRow(row) : null;
}

export type InsertAutoRuleParams = {
  ruleId: string;
  name: string;
  campaignId: string;
  triggerType: string;
  threshold: number;
  windowDays: number;
  isActive: boolean;
  createdBy: string;
  now: Date;
};

export async function insertAutoRule(
  params: InsertAutoRuleParams,
): Promise<void> {
  await scylla.execute(
    "INSERT INTO voucher_auto_rules_by_id (rule_id, name, campaign_id, trigger_type, threshold, window_days, is_active, granted_count, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)",
    [
      params.ruleId,
      params.name,
      params.campaignId,
      params.triggerType,
      params.threshold,
      params.windowDays,
      params.isActive,
      params.createdBy,
      params.now,
      params.now,
    ],
    { prepare: true },
  );
}

export async function setAutoRuleActive(
  ruleId: string,
  isActive: boolean,
): Promise<void> {
  await scylla.execute(
    "UPDATE voucher_auto_rules_by_id SET is_active = ?, updated_at = ? WHERE rule_id = ?",
    [isActive, new Date(), ruleId],
    { prepare: true },
  );
}

// Same read + CAS increment shape as claimGrantSlot: regular columns cannot
// do `count = count + 1`, so a lost race retries and an exhausted loop
// fails quietly (a missed count on a rule is a metric glitch, not a grant).
export async function bumpRuleGrantedCount(ruleId: string): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const row = await findAutoRuleRowById(ruleId);
    if (!row || row.granted_count === null) return;
    const current = row.granted_count;
    const result = await scylla.execute(
      "UPDATE voucher_auto_rules_by_id SET granted_count = ?, updated_at = ? WHERE rule_id = ? IF granted_count = ?",
      [current + 1, new Date(), ruleId, current],
      { prepare: true },
    );
    if (result.wasApplied()) return;
  }
}

// Dedupe ledger write: the LWT is the serialization point, so the same
// (rule, user, milestone) can only ever pay out once — retries, double
// deliveries and concurrent triggers all funnel through this claim.
export async function claimAutoGrantDedupe(
  ruleId: string,
  userId: string,
  dedupeKey: string,
  walletId: string,
  now: Date,
): Promise<boolean> {
  const result = await scylla.execute(
    "INSERT INTO voucher_auto_grants_by_rule (rule_id, user_id, dedupe_key, wallet_id, granted_at) VALUES (?, ?, ?, ?, ?) IF NOT EXISTS",
    [ruleId, userId, dedupeKey, walletId, now],
    { prepare: true },
  );
  return result.wasApplied();
}

// Undo a claimed milestone when the wallet write itself fails, so a retry
// can pay it out later instead of the ledger eating the grant forever.
export async function releaseAutoGrantDedupe(
  ruleId: string,
  userId: string,
  dedupeKey: string,
): Promise<void> {
  await scylla.execute(
    "DELETE FROM voucher_auto_grants_by_rule WHERE rule_id = ? AND user_id = ? AND dedupe_key = ? IF EXISTS",
    [ruleId, userId, dedupeKey],
    { prepare: true },
  );
}

function toStatsRow(raw: Record<string, unknown>): CustomerStatsRow {
  return {
    customer_id: String(raw.customer_id),
    completed_bookings: (raw.completed_bookings as number | null) ?? null,
    completed_orders: (raw.completed_orders as number | null) ?? null,
    total_spent:
      raw.total_spent === null || raw.total_spent === undefined
        ? null
        : Number(raw.total_spent),
    last_activity_at: (raw.last_activity_at as Date | null) ?? null,
    updated_at: (raw.updated_at as Date | null) ?? null,
  };
}

const STATS_COLUMNS =
  "customer_id, completed_bookings, completed_orders, total_spent, last_activity_at, updated_at";

export async function findCustomerStatsRow(
  customerId: string,
): Promise<CustomerStatsRow | null> {
  const result = await scylla.execute(
    `SELECT ${STATS_COLUMNS} FROM customer_stats_by_id WHERE customer_id = ?`,
    [customerId],
    { prepare: true },
  );
  const row = result.first() as unknown as Record<string, unknown> | null;
  return row ? toStatsRow(row) : null;
}

export async function insertCustomerStatsIfAbsent(
  row: Omit<CustomerStatsRow, "updated_at"> & { updated_at: Date },
): Promise<boolean> {
  const result = await scylla.execute(
    "INSERT INTO customer_stats_by_id (customer_id, completed_bookings, completed_orders, total_spent, last_activity_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) IF NOT EXISTS",
    [
      row.customer_id,
      row.completed_bookings,
      row.completed_orders,
      row.total_spent,
      row.last_activity_at,
      row.updated_at,
    ],
    { prepare: true },
  );
  return result.wasApplied();
}

// Full-row CAS on the numeric columns: concurrent activity events on the
// same customer serialize here instead of silently losing a count.
export async function casUpdateCustomerStats(
  before: CustomerStatsRow,
  next: Omit<CustomerStatsRow, "updated_at" | "customer_id">,
): Promise<boolean> {
  const result = await scylla.execute(
    "UPDATE customer_stats_by_id SET completed_bookings = ?, completed_orders = ?, total_spent = ?, last_activity_at = ?, updated_at = ? WHERE customer_id = ? IF completed_bookings = ? AND completed_orders = ? AND total_spent = ?",
    [
      next.completed_bookings,
      next.completed_orders,
      next.total_spent,
      next.last_activity_at,
      new Date(),
      before.customer_id,
      before.completed_bookings,
      before.completed_orders,
      before.total_spent,
    ],
    { prepare: true },
  );
  return result.wasApplied();
}

// Token-range scan of the rollup table. Callers pass an explicit cap —
// the dispatcher board and the win-back scan are dev-scale tools, so a
// bounded full read is the intended query.
export async function listCustomerStatsRows(
  limit: number,
): Promise<CustomerStatsRow[]> {
  const result = await scylla.execute(
    `SELECT ${STATS_COLUMNS} FROM customer_stats_by_id LIMIT ?`,
    [Math.min(Math.max(limit, 1), 5000)],
    { prepare: true },
  );
  return result.rows.map((row) =>
    toStatsRow(row as unknown as Record<string, unknown>),
  );
}

// Backfill reads: one partition each, so the rollup rebuild needs no
// ALLOW FILTERING and stays proportional to the customer's own history.
export async function listCustomerBookingRefs(
  customerId: string,
): Promise<{ status: string | null; total: number | null; at: Date | null }[]> {
  const result = await scylla.execute(
    "SELECT status, total, scheduled_at FROM bookings_by_customer WHERE customer_id = ?",
    [customerId],
    { prepare: true },
  );
  return result.rows.map((raw) => {
    const row = raw as unknown as Record<string, unknown>;
    return {
      status: (row.status as string | null) ?? null,
      total:
        row.total === null || row.total === undefined
          ? null
          : Number(row.total),
      at: (row.scheduled_at as Date | null) ?? null,
    };
  });
}

export async function listCustomerOrderRefs(
  customerId: string,
): Promise<{ status: string | null; total: number | null; at: Date | null }[]> {
  const result = await scylla.execute(
    "SELECT status, total, created_at FROM orders_by_customer WHERE customer_id = ?",
    [customerId],
    { prepare: true },
  );
  return result.rows.map((raw) => {
    const row = raw as unknown as Record<string, unknown>;
    return {
      status: (row.status as string | null) ?? null,
      total:
        row.total === null || row.total === undefined
          ? null
          : Number(row.total),
      at: (row.created_at as Date | null) ?? null,
    };
  });
}
