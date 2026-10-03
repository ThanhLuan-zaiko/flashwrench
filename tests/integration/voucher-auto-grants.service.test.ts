// Auto-grant evaluator: trigger matching, milestone dedupe, campaign caps
// and the win-back sweep. The stats map and dedupe ledger in the mocks
// behave like the real LWT/CAS writes, so retries and re-crossings are
// exercised against storage semantics. Every handler is best-effort.
import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makeUserRow } from "../helpers/auth.fixtures";
import {
  resetServiceMocks,
  serviceStubs,
  userRepoMocks,
  voucherCampaignRepoMocks,
  voucherStubs,
  voucherWalletRepoMocks,
} from "../helpers/service-mocks";
import {
  makeCampaignRow,
  VOUCHER_CUSTOMER_ID,
} from "../helpers/voucher.fixtures";
import {
  AUTO_RULE_ID,
  makeAutoRuleRow,
  makeCustomerStatsRow,
} from "../helpers/voucher-auto.fixtures";
import {
  autoRuleRepoMocks,
  autoRuleStubs,
} from "../helpers/voucher-auto.mocks";

// Helpers first, mocks second, system under test last.
mock.module("@/lib/auth/user.repository", () => userRepoMocks);
mock.module("@/lib/vouchers/auto-rule.repository", () => autoRuleRepoMocks);
mock.module(
  "@/lib/vouchers/voucher-campaign.repository",
  () => voucherCampaignRepoMocks,
);
mock.module(
  "@/lib/vouchers/voucher-wallet.repository",
  () => voucherWalletRepoMocks,
);

import {
  handleVoucherBookingCompleted,
  handleVoucherOrderDelivered,
  handleVoucherOrderRefunded,
  handleVoucherReviewCreated,
  handleVoucherSignup,
} from "@/lib/vouchers/auto-grant.service";
import { runVoucherWinBackScan } from "@/lib/vouchers/auto-grant-winback.service";

const NOW = new Date("2026-09-15T12:00:00.000Z");

beforeEach(() => {
  resetServiceMocks();
  voucherStubs.campaignById = makeCampaignRow({
    scope: "all",
    min_order: 0,
    per_user_limit: 10,
  });
  serviceStubs.userById = makeUserRow();
});

function dedupeKey(ruleId: string, key: string): string {
  return `${ruleId}:${VOUCHER_CUSTOMER_ID}:${key}`;
}

describe("signup trigger", () => {
  test("grants the welcome voucher exactly once", async () => {
    autoRuleStubs.ruleRows = [makeAutoRuleRow({ trigger_type: "signup" })];
    await handleVoucherSignup(VOUCHER_CUSTOMER_ID);
    await handleVoucherSignup(VOUCHER_CUSTOMER_ID);
    expect(voucherStubs.insertedWallets).toHaveLength(1);
    expect(voucherStubs.insertedWallets[0]?.grantedBy).toBeNull();
    expect(
      autoRuleStubs.dedupeLedger.has(dedupeKey(AUTO_RULE_ID, "signup")),
    ).toBe(true);
  });

  test("inactive rules and inactive campaigns stay quiet", async () => {
    autoRuleStubs.ruleRows = [
      makeAutoRuleRow({ trigger_type: "signup", is_active: false }),
    ];
    await handleVoucherSignup(VOUCHER_CUSTOMER_ID);
    expect(voucherStubs.insertedWallets).toHaveLength(0);

    voucherStubs.campaignById = makeCampaignRow({
      scope: "all",
      min_order: 0,
      is_active: false,
    });
    autoRuleStubs.ruleRows = [makeAutoRuleRow({ trigger_type: "signup" })];
    await handleVoucherSignup(VOUCHER_CUSTOMER_ID);
    expect(voucherStubs.insertedWallets).toHaveLength(0);
  });

  test("a rule outside its campaign window does not grant", async () => {
    voucherStubs.campaignById = makeCampaignRow({
      scope: "all",
      min_order: 0,
      per_user_limit: 10,
      start_at: new Date("2027-01-01T00:00:00.000Z"),
    });
    autoRuleStubs.ruleRows = [makeAutoRuleRow({ trigger_type: "signup" })];
    await handleVoucherSignup(VOUCHER_CUSTOMER_ID);
    expect(voucherStubs.insertedWallets).toHaveLength(0);
    // The milestone stays unclaimed so the customer can still earn it.
    expect(autoRuleStubs.dedupeLedger.size).toBe(0);
  });
});

describe("booking_count trigger", () => {
  test("grants when the completion lands on the milestone", async () => {
    autoRuleStubs.ruleRows = [makeAutoRuleRow({ threshold: 5 })];
    autoRuleStubs.statsByCustomer.set(
      VOUCHER_CUSTOMER_ID,
      makeCustomerStatsRow({ completed_bookings: 4 }),
    );
    await handleVoucherBookingCompleted(VOUCHER_CUSTOMER_ID, 200000);
    expect(voucherStubs.insertedWallets).toHaveLength(1);
  });

  test("no grant between milestones", async () => {
    autoRuleStubs.ruleRows = [makeAutoRuleRow({ threshold: 5 })];
    autoRuleStubs.statsByCustomer.set(
      VOUCHER_CUSTOMER_ID,
      makeCustomerStatsRow({ completed_bookings: 3 }),
    );
    await handleVoucherBookingCompleted(VOUCHER_CUSTOMER_ID, 200000);
    expect(voucherStubs.insertedWallets).toHaveLength(0);
    expect(autoRuleStubs.dedupeLedger.size).toBe(0);
  });

  test("repeated events on the same milestone never pay twice", async () => {
    autoRuleStubs.ruleRows = [makeAutoRuleRow({ threshold: 5 })];
    autoRuleStubs.statsByCustomer.set(
      VOUCHER_CUSTOMER_ID,
      makeCustomerStatsRow({ completed_bookings: 4 }),
    );
    await handleVoucherBookingCompleted(VOUCHER_CUSTOMER_ID, 200000);
    // Replay: stats already at 5 so the delta makes 6 — no new milestone.
    await handleVoucherBookingCompleted(VOUCHER_CUSTOMER_ID, 200000);
    expect(voucherStubs.insertedWallets).toHaveLength(1);
  });
});

describe("order triggers", () => {
  test("order_count grants on every Nth delivered order", async () => {
    autoRuleStubs.ruleRows = [
      makeAutoRuleRow({ trigger_type: "order_count", threshold: 2 }),
    ];
    autoRuleStubs.statsByCustomer.set(
      VOUCHER_CUSTOMER_ID,
      makeCustomerStatsRow({ completed_bookings: 0, completed_orders: 1 }),
    );
    await handleVoucherOrderDelivered(VOUCHER_CUSTOMER_ID, "order-1", 100000);
    expect(voucherStubs.insertedWallets).toHaveLength(1);
  });

  test("order_value grants only when the total clears the bar", async () => {
    autoRuleStubs.ruleRows = [
      makeAutoRuleRow({ trigger_type: "order_value", threshold: 500000 }),
    ];
    await handleVoucherOrderDelivered(VOUCHER_CUSTOMER_ID, "order-low", 100000);
    expect(voucherStubs.insertedWallets).toHaveLength(0);
    await handleVoucherOrderDelivered(VOUCHER_CUSTOMER_ID, "order-big", 600000);
    expect(voucherStubs.insertedWallets).toHaveLength(1);
    // A retry of the same order id dedupes on the order-scoped key.
    await handleVoucherOrderDelivered(VOUCHER_CUSTOMER_ID, "order-big", 600000);
    expect(voucherStubs.insertedWallets).toHaveLength(1);
  });

  test("spend_total pays each crossed milestone, including multiples", async () => {
    autoRuleStubs.ruleRows = [
      makeAutoRuleRow({ trigger_type: "spend_total", threshold: 1000000 }),
    ];
    autoRuleStubs.statsByCustomer.set(
      VOUCHER_CUSTOMER_ID,
      makeCustomerStatsRow({ total_spent: 800000 }),
    );
    // 800k + 1.5m = 2.3m: crosses milestones 1 and 2 in one event.
    await handleVoucherOrderDelivered(VOUCHER_CUSTOMER_ID, "order-x", 1500000);
    expect(voucherStubs.insertedWallets).toHaveLength(2);
    expect(autoRuleStubs.dedupeLedger.has(dedupeKey(AUTO_RULE_ID, "s1"))).toBe(
      true,
    );
    expect(autoRuleStubs.dedupeLedger.has(dedupeKey(AUTO_RULE_ID, "s2"))).toBe(
      true,
    );
  });

  test("per-user campaign limit releases the milestone claim", async () => {
    voucherStubs.userCampaignCount = 10;
    voucherStubs.campaignById = makeCampaignRow({
      scope: "all",
      min_order: 0,
      per_user_limit: 10,
    });
    autoRuleStubs.ruleRows = [makeAutoRuleRow({ trigger_type: "signup" })];
    await handleVoucherSignup(VOUCHER_CUSTOMER_ID);
    expect(voucherStubs.insertedWallets).toHaveLength(0);
    // Claim released: a later retry (e.g. after admin lifts the limit)
    // can still pay the milestone out.
    expect(autoRuleStubs.releasedDedupe).toContain(
      dedupeKey(AUTO_RULE_ID, "signup"),
    );
    expect(autoRuleStubs.dedupeLedger.size).toBe(0);
  });

  test("a sold-out campaign releases both claims and stays silent", async () => {
    voucherStubs.grantSlotOutcome = "limit";
    autoRuleStubs.ruleRows = [makeAutoRuleRow({ trigger_type: "signup" })];
    await handleVoucherSignup(VOUCHER_CUSTOMER_ID);
    expect(voucherStubs.insertedWallets).toHaveLength(0);
    expect(autoRuleStubs.dedupeLedger.size).toBe(0);
  });
});

describe("review_created trigger", () => {
  test("grants per review reference and dedupes retries", async () => {
    autoRuleStubs.ruleRows = [
      makeAutoRuleRow({ trigger_type: "review_created" }),
    ];
    await handleVoucherReviewCreated(VOUCHER_CUSTOMER_ID, "booking-1");
    await handleVoucherReviewCreated(VOUCHER_CUSTOMER_ID, "booking-1");
    await handleVoucherReviewCreated(VOUCHER_CUSTOMER_ID, "order:o1");
    expect(voucherStubs.insertedWallets).toHaveLength(2);
  });
});

describe("refund unwind", () => {
  test("drops the delivered count and spend without touching wallets", async () => {
    autoRuleStubs.statsByCustomer.set(
      VOUCHER_CUSTOMER_ID,
      makeCustomerStatsRow({ completed_orders: 3, total_spent: 900000 }),
    );
    await handleVoucherOrderRefunded(VOUCHER_CUSTOMER_ID, 300000);
    const row = autoRuleStubs.statsByCustomer.get(VOUCHER_CUSTOMER_ID);
    expect(row?.completed_orders).toBe(2);
    expect(row?.total_spent).toBe(600000);
    expect(voucherStubs.insertedWallets).toHaveLength(0);
  });

  test("clamps at zero instead of going negative", async () => {
    autoRuleStubs.statsByCustomer.set(
      VOUCHER_CUSTOMER_ID,
      makeCustomerStatsRow({ completed_orders: 0, total_spent: 100000 }),
    );
    await handleVoucherOrderRefunded(VOUCHER_CUSTOMER_ID, 300000);
    const row = autoRuleStubs.statsByCustomer.get(VOUCHER_CUSTOMER_ID);
    expect(row?.completed_orders).toBe(0);
    expect(row?.total_spent).toBe(0);
  });
});

describe("best-effort contract", () => {
  test("a repository failure never propagates to the caller", async () => {
    autoRuleRepoMocks.listAutoRuleRows.mockImplementationOnce(async () => {
      throw new Error("scylla down");
    });
    await expect(
      handleVoucherSignup(VOUCHER_CUSTOMER_ID),
    ).resolves.toBeUndefined();
    await expect(
      handleVoucherBookingCompleted(VOUCHER_CUSTOMER_ID, 100),
    ).resolves.toBeUndefined();
  });

  test("a wallet insert failure releases dedupe and the grant slot", async () => {
    voucherStubs.campaignById = makeCampaignRow({
      scope: "all",
      min_order: 0,
      per_user_limit: 10,
    });
    autoRuleStubs.ruleRows = [makeAutoRuleRow({ trigger_type: "signup" })];
    voucherWalletRepoMocks.insertWallet.mockImplementationOnce(async () => {
      throw new Error("write failed");
    });
    await handleVoucherSignup(VOUCHER_CUSTOMER_ID);
    expect(voucherCampaignRepoMocks.releaseGrantSlot.mock.calls).toHaveLength(
      1,
    );
    expect(autoRuleStubs.releasedDedupe).toContain(
      dedupeKey(AUTO_RULE_ID, "signup"),
    );
    expect(autoRuleStubs.dedupeLedger.size).toBe(0);
  });
});

describe("runVoucherWinBackScan", () => {
  test("pays customers quiet for the rule window, once per month", async () => {
    autoRuleStubs.ruleRows = [
      makeAutoRuleRow({ trigger_type: "win_back", window_days: 30 }),
    ];
    autoRuleStubs.statsScanRows = [
      makeCustomerStatsRow({
        last_activity_at: new Date("2026-08-01T00:00:00.000Z"),
      }),
      makeCustomerStatsRow({
        customer_id: "22222222-2222-4222-8222-222222222222",
        last_activity_at: new Date("2026-09-14T00:00:00.000Z"),
      }),
    ];
    const first = await runVoucherWinBackScan(NOW);
    expect(first).toEqual({ scannedCustomers: 2, granted: 1 });
    const second = await runVoucherWinBackScan(NOW);
    expect(second.granted).toBe(0);
    expect(voucherStubs.insertedWallets).toHaveLength(1);
  });

  test("no win_back rules means zero work", async () => {
    autoRuleStubs.ruleRows = [makeAutoRuleRow({ trigger_type: "signup" })];
    const result = await runVoucherWinBackScan(NOW);
    expect(result).toEqual({ scannedCustomers: 0, granted: 0 });
    expect(autoRuleRepoMocks.listCustomerStatsRows.mock.calls).toHaveLength(0);
  });

  test("a new month bucket pays the same customer again", async () => {
    autoRuleStubs.ruleRows = [
      makeAutoRuleRow({ trigger_type: "win_back", window_days: 30 }),
    ];
    autoRuleStubs.statsScanRows = [
      makeCustomerStatsRow({
        last_activity_at: new Date("2026-07-01T00:00:00.000Z"),
      }),
    ];
    await runVoucherWinBackScan(new Date("2026-09-15T12:00:00.000Z"));
    const again = await runVoucherWinBackScan(
      new Date("2026-10-02T12:00:00.000Z"),
    );
    expect(again.granted).toBe(1);
    expect(voucherStubs.insertedWallets).toHaveLength(2);
  });
});
