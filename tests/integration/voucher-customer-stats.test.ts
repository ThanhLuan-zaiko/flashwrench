// Customer activity rollup: first-event backfill from the customer's own
// partitions, delta application, CAS retries and the lost-insert race. The
// mocks model real LWT/CAS semantics so races are exercised for real.
import { beforeEach, describe, expect, mock, test } from "bun:test";
import { VOUCHER_CUSTOMER_ID } from "../helpers/voucher.fixtures";
import { makeCustomerStatsRow } from "../helpers/voucher-auto.fixtures";
import {
  autoRuleRepoMocks,
  autoRuleStubs,
} from "../helpers/voucher-auto.mocks";

mock.module("@/lib/vouchers/auto-rule.repository", () => autoRuleRepoMocks);

import { applyCustomerActivity } from "@/lib/vouchers/customer-stats.service";

const NOW = new Date("2026-09-15T12:00:00.000Z");

function seedStats(overrides?: Parameters<typeof makeCustomerStatsRow>[0]) {
  const row = makeCustomerStatsRow(overrides);
  autoRuleStubs.statsByCustomer.set(VOUCHER_CUSTOMER_ID, row);
  return row;
}

beforeEach(() => {
  // The suite only needs the auto-rule stubs; a full service reset would
  // pull in unrelated mock modules the rollup never touches.
  autoRuleStubs.statsByCustomer = new Map();
  autoRuleStubs.statsScanRows = [];
  autoRuleStubs.statsCasPlan = [];
  autoRuleStubs.statsInsertLoses = 0;
  autoRuleStubs.statsPeerRow = null;
  autoRuleStubs.bookingRefs = [];
  autoRuleStubs.orderRefs = [];
});

describe("applyCustomerActivity backfill", () => {
  test("first event rebuilds history including the committing event", async () => {
    // bookings_by_customer already shows this booking completed — the
    // status write lands before the hook runs — so the backfill counts
    // it and the delta must not be applied on top.
    autoRuleStubs.bookingRefs = [
      { status: "completed", total: 100000, at: new Date("2026-08-01") },
      { status: "completed", total: 200000, at: new Date("2026-09-15") },
      { status: "cancelled", total: 50000, at: new Date("2026-08-05") },
    ];
    autoRuleStubs.orderRefs = [
      { status: "delivered", total: 300000, at: new Date("2026-08-20") },
      { status: "pending", total: 80000, at: new Date("2026-09-01") },
    ];

    const result = await applyCustomerActivity(
      VOUCHER_CUSTOMER_ID,
      { bookings: 1, spent: 200000 },
      NOW,
    );
    expect(result?.completed_bookings).toBe(2);
    expect(result?.completed_orders).toBe(1);
    expect(result?.total_spent).toBe(600000);
    expect(result?.last_activity_at?.toISOString()).toBe(
      "2026-09-15T00:00:00.000Z",
    );
    const stored = autoRuleStubs.statsByCustomer.get(VOUCHER_CUSTOMER_ID);
    expect(stored?.total_spent).toBe(600000);
  });

  test("a winning backfill skips the delta — the event is already counted", async () => {
    // The committing status write lands before the hook runs, so refs
    // always contain the event. Applying the delta on top would double
    // count it; a winning insert returns the backfilled row untouched.
    autoRuleStubs.orderRefs = [{ status: "delivered", total: 150000, at: NOW }];
    const result = await applyCustomerActivity(
      VOUCHER_CUSTOMER_ID,
      { orders: 1, spent: 150000 },
      NOW,
    );
    expect(result?.completed_orders).toBe(1);
    expect(result?.total_spent).toBe(150000);
  });
});

describe("applyCustomerActivity deltas", () => {
  test("adds the delta to an existing row and keeps the latest activity", async () => {
    seedStats({ completed_bookings: 4, total_spent: 800000 });
    const result = await applyCustomerActivity(
      VOUCHER_CUSTOMER_ID,
      { bookings: 1, spent: 200000 },
      NOW,
    );
    expect(result?.completed_bookings).toBe(5);
    expect(result?.total_spent).toBe(1000000);
    expect(result?.last_activity_at?.toISOString()).toBe(NOW.toISOString());
  });

  test("a refund delta unwinds the counters", async () => {
    seedStats({ completed_orders: 3, total_spent: 900000 });
    const result = await applyCustomerActivity(
      VOUCHER_CUSTOMER_ID,
      { orders: -1, spent: -300000 },
      NOW,
    );
    expect(result?.completed_orders).toBe(2);
    expect(result?.total_spent).toBe(600000);
  });

  test("keeps the stored last_activity_at when the event is older", async () => {
    seedStats({
      last_activity_at: new Date("2026-09-20T00:00:00.000Z"),
    });
    const result = await applyCustomerActivity(
      VOUCHER_CUSTOMER_ID,
      { bookings: 1 },
      NOW,
    );
    expect(result?.last_activity_at?.toISOString()).toBe(
      "2026-09-20T00:00:00.000Z",
    );
  });
});

describe("applyCustomerActivity races", () => {
  test("a lost CAS retries against the row the peer committed", async () => {
    seedStats({ completed_bookings: 4, total_spent: 800000 });
    autoRuleStubs.statsCasPlan = ["lose"];
    const result = await applyCustomerActivity(
      VOUCHER_CUSTOMER_ID,
      { bookings: 1, spent: 200000 },
      NOW,
    );
    // Peer landed +1 between our read and our CAS; the retry must start
    // from the peer's 5, not our stale 4.
    expect(result?.completed_bookings).toBe(6);
    expect(result?.total_spent).toBe(1000000);
  });

  test("a lost insert race applies the delta onto the peer's row", async () => {
    autoRuleStubs.statsInsertLoses = 1;
    autoRuleStubs.statsPeerRow = makeCustomerStatsRow({
      completed_bookings: 1,
      total_spent: 200000,
    });
    const result = await applyCustomerActivity(
      VOUCHER_CUSTOMER_ID,
      { bookings: 1, spent: 100000 },
      NOW,
    );
    expect(result?.completed_bookings).toBe(2);
    expect(result?.total_spent).toBe(300000);
  });

  test("exhausted retries return null instead of hanging the caller", async () => {
    seedStats();
    autoRuleStubs.statsCasPlan = ["lose", "lose", "lose"];
    const result = await applyCustomerActivity(
      VOUCHER_CUSTOMER_ID,
      { bookings: 1 },
      NOW,
    );
    expect(result).toBeNull();
  });
});
