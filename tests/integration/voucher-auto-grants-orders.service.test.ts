// Order status transitions feeding the loyalty rollup: a rejected return
// must not re-count the delivery, and refunds unwind the counters without
// touching wallets. Shares the auto-grant mocks with the evaluator suite.
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
import { VOUCHER_CUSTOMER_ID } from "../helpers/voucher.fixtures";
import { makeCustomerStatsRow } from "../helpers/voucher-auto.fixtures";
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
  handleVoucherOrderRefunded,
  handleVoucherOrderTransition,
} from "@/lib/vouchers/auto-grant.service";

beforeEach(() => {
  resetServiceMocks();
  serviceStubs.userById = makeUserRow();
});

describe("order status transitions", () => {
  test("rejecting a return does not count the delivery twice", async () => {
    autoRuleStubs.statsByCustomer.set(
      VOUCHER_CUSTOMER_ID,
      makeCustomerStatsRow({ completed_orders: 3, total_spent: 900000 }),
    );
    await handleVoucherOrderTransition(
      {
        customer_id: VOUCHER_CUSTOMER_ID,
        order_id: "order-r",
        total: 300000,
        status: "return_requested",
      },
      "delivered",
    );
    const row = autoRuleStubs.statsByCustomer.get(VOUCHER_CUSTOMER_ID);
    expect(row?.completed_orders).toBe(3);
    expect(row?.total_spent).toBe(900000);
  });

  test("a delivery from shipping still counts", async () => {
    autoRuleStubs.statsByCustomer.set(
      VOUCHER_CUSTOMER_ID,
      makeCustomerStatsRow({ completed_orders: 3, total_spent: 900000 }),
    );
    await handleVoucherOrderTransition(
      {
        customer_id: VOUCHER_CUSTOMER_ID,
        order_id: "order-s",
        total: 300000,
        status: "shipping",
      },
      "delivered",
    );
    const row = autoRuleStubs.statsByCustomer.get(VOUCHER_CUSTOMER_ID);
    expect(row?.completed_orders).toBe(4);
    expect(row?.total_spent).toBe(1200000);
  });

  test("a refund from return_requested still unwinds the counters", async () => {
    autoRuleStubs.statsByCustomer.set(
      VOUCHER_CUSTOMER_ID,
      makeCustomerStatsRow({ completed_orders: 3, total_spent: 900000 }),
    );
    await handleVoucherOrderTransition(
      {
        customer_id: VOUCHER_CUSTOMER_ID,
        order_id: "order-f",
        total: 300000,
        status: "return_requested",
      },
      "refunded",
    );
    const row = autoRuleStubs.statsByCustomer.get(VOUCHER_CUSTOMER_ID);
    expect(row?.completed_orders).toBe(2);
    expect(row?.total_spent).toBe(600000);
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
