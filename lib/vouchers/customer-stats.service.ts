// Per-customer activity rollup. The first activity event after install
// backfills the row from the customer's own booking/order partitions, so
// loyal customers keep their history instead of restarting at zero.

import {
  casUpdateCustomerStats,
  findCustomerStatsRow,
  insertCustomerStatsIfAbsent,
  listCustomerBookingRefs,
  listCustomerOrderRefs,
} from "./auto-rule.repository";
import type { CustomerStatsRow } from "./auto-rule.types";

function emptyStats(customerId: string): CustomerStatsRow {
  return {
    customer_id: customerId,
    completed_bookings: 0,
    completed_orders: 0,
    total_spent: 0,
    last_activity_at: null,
    updated_at: null,
  };
}

// Rebuild the rollup from the per-customer partitions. Bookings count when
// completed, orders when delivered; spend is the sum of their totals.
// Only runs when no row exists — afterwards deltas keep it current.
async function backfillCustomerStats(
  customerId: string,
  now: Date,
): Promise<boolean> {
  const [bookings, orders] = await Promise.all([
    listCustomerBookingRefs(customerId),
    listCustomerOrderRefs(customerId),
  ]);
  let completedBookings = 0;
  let completedOrders = 0;
  let totalSpent = 0;
  let lastActivity: Date | null = null;
  for (const booking of bookings) {
    if (booking.status !== "completed") continue;
    completedBookings += 1;
    totalSpent += booking.total ?? 0;
    if (booking.at && (!lastActivity || booking.at > lastActivity)) {
      lastActivity = booking.at;
    }
  }
  for (const order of orders) {
    if (order.status !== "delivered") continue;
    completedOrders += 1;
    totalSpent += order.total ?? 0;
    if (order.at && (!lastActivity || order.at > lastActivity)) {
      lastActivity = order.at;
    }
  }
  return insertCustomerStatsIfAbsent({
    customer_id: customerId,
    completed_bookings: completedBookings,
    completed_orders: completedOrders,
    total_spent: totalSpent,
    last_activity_at: lastActivity,
    updated_at: now,
  });
}

export type CustomerActivityDelta = {
  bookings?: number;
  orders?: number;
  spent?: number;
};

// Apply one activity delta to the rollup. A freshly backfilled row already
// includes the committing event (the by_customer status write lands before
// hooks run), so the delta is skipped in that case — never double counted.
// CAS retries ride out concurrent events on the same customer.
export async function applyCustomerActivity(
  customerId: string,
  delta: CustomerActivityDelta,
  activityAt: Date,
): Promise<CustomerStatsRow | null> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const row = await findCustomerStatsRow(customerId);
    if (!row) {
      // A winning backfill already counted the committing event (the
      // by_customer status write lands before hooks run), so it returns
      // without applying the delta — never double counted. A lost race
      // means a peer created the row; loop and apply the delta onto it.
      const claimed = await backfillCustomerStats(customerId, activityAt);
      if (claimed) {
        const fresh = await findCustomerStatsRow(customerId);
        if (fresh) return fresh;
      }
      continue;
    }
    const next = {
      completed_bookings: Math.max(
        0,
        (row.completed_bookings ?? 0) + (delta.bookings ?? 0),
      ),
      completed_orders: Math.max(
        0,
        (row.completed_orders ?? 0) + (delta.orders ?? 0),
      ),
      total_spent: Math.max(0, (row.total_spent ?? 0) + (delta.spent ?? 0)),
      last_activity_at:
        row.last_activity_at && row.last_activity_at > activityAt
          ? row.last_activity_at
          : activityAt,
    };
    const applied = await casUpdateCustomerStats(row, next);
    if (applied) {
      return { ...row, ...next, updated_at: new Date() };
    }
  }
  return null;
}

export { emptyStats };
