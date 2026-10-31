// Fixed-value vouchers keep their leftover: a 1.000.000đ wallet spent on a
// 700.000đ order stays active with 300.000đ, a second order can use it, and
// a cancelled order gives its part back without ever exceeding face value.
// Percent and free-service wallets stay single-use.
import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  resetServiceMocks,
  voucherCampaignRepoMocks,
  voucherStubs,
  voucherWalletRepoMocks,
} from "../helpers/service-mocks";
import {
  makeCampaignRow,
  makeWalletRow,
  VOUCHER_CUSTOMER_ID,
  VOUCHER_WALLET_ID,
} from "../helpers/voucher.fixtures";
import {
  resetVoucherMocks,
  voucherRealtimeMocks,
} from "../helpers/voucher.mocks";

mock.module(
  "@/lib/vouchers/voucher-campaign.repository",
  () => voucherCampaignRepoMocks,
);
mock.module(
  "@/lib/vouchers/voucher-wallet.repository",
  () => voucherWalletRepoMocks,
);
mock.module("@/lib/vouchers/voucher-realtime", () => voucherRealtimeMocks);

import {
  redeemWallet,
  releaseWalletReservation,
  restoreWalletForRef,
} from "@/lib/vouchers/voucher-spend.service";

const FACE = 1_000_000;

function fixedWallet(overrides = {}) {
  return makeWalletRow({
    wallet_id: VOUCHER_WALLET_ID,
    user_id: VOUCHER_CUSTOMER_ID,
    discount_type: "fixed",
    discount_value: FACE,
    remaining_value: FACE,
    status: "active",
    ...overrides,
  });
}

beforeEach(() => {
  resetServiceMocks();
  resetVoucherMocks();
  voucherStubs.campaignById = makeCampaignRow({ scope: "all", min_order: 0 });
  voucherStubs.walletById = fixedWallet();
});

describe("fixed voucher partial spend", () => {
  test("a 700.000đ order leaves 300.000đ active", async () => {
    const result = await redeemWallet({
      walletId: VOUCHER_WALLET_ID,
      userId: VOUCHER_CUSTOMER_ID,
      subtotal: 700_000,
      kind: "order",
      orderId: "order-1",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.discount).toBe(700_000);
    expect(result.data.wallet.status).toBe("active");
    expect(result.data.wallet.remainingValue).toBe(300_000);
    expect(voucherStubs.walletById?.remaining_value).toBe(300_000);
  });

  test("the leftover funds a second order and then closes the wallet", async () => {
    await redeemWallet({
      walletId: VOUCHER_WALLET_ID,
      userId: VOUCHER_CUSTOMER_ID,
      subtotal: 700_000,
      kind: "order",
      orderId: "order-1",
    });
    const second = await redeemWallet({
      walletId: VOUCHER_WALLET_ID,
      userId: VOUCHER_CUSTOMER_ID,
      subtotal: 500_000,
      kind: "order",
      orderId: "order-2",
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.data.discount).toBe(300_000);
    expect(second.data.wallet.status).toBe("used");
    expect(second.data.wallet.remainingValue).toBe(0);
  });

  test("cancelling a partial order gives its amount back", async () => {
    await redeemWallet({
      walletId: VOUCHER_WALLET_ID,
      userId: VOUCHER_CUSTOMER_ID,
      subtotal: 700_000,
      kind: "order",
      orderId: "order-1",
    });
    await restoreWalletForRef({
      walletId: VOUCHER_WALLET_ID,
      userId: VOUCHER_CUSTOMER_ID,
      orderId: "order-1",
      amount: 700_000,
    });
    expect(voucherStubs.walletById?.remaining_value).toBe(FACE);
    expect(voucherStubs.walletById?.status).toBe("active");
  });

  test("a repeated refund never grows the wallet past its face value", async () => {
    await redeemWallet({
      walletId: VOUCHER_WALLET_ID,
      userId: VOUCHER_CUSTOMER_ID,
      subtotal: 700_000,
      kind: "order",
      orderId: "order-1",
    });
    await restoreWalletForRef({
      walletId: VOUCHER_WALLET_ID,
      userId: VOUCHER_CUSTOMER_ID,
      orderId: "order-1",
      amount: 700_000,
    });
    await restoreWalletForRef({
      walletId: VOUCHER_WALLET_ID,
      userId: VOUCHER_CUSTOMER_ID,
      orderId: "order-1",
      amount: 700_000,
    });
    expect(voucherStubs.walletById?.remaining_value).toBe(FACE);
  });

  test("a failed checkout releases exactly what it reserved", async () => {
    await redeemWallet({
      walletId: VOUCHER_WALLET_ID,
      userId: VOUCHER_CUSTOMER_ID,
      subtotal: 400_000,
      kind: "order",
      orderId: "order-1",
    });
    await releaseWalletReservation(
      VOUCHER_WALLET_ID,
      { orderId: "order-1" },
      400_000,
    );
    expect(voucherStubs.walletById?.remaining_value).toBe(FACE);
  });

  test("a stale remaining value loses the CAS and spends nothing", async () => {
    voucherStubs.casRejected = true;
    const result = await redeemWallet({
      walletId: VOUCHER_WALLET_ID,
      userId: VOUCHER_CUSTOMER_ID,
      subtotal: 700_000,
      kind: "order",
      orderId: "order-1",
    });
    expect(result.ok).toBe(false);
    expect(voucherStubs.walletById?.remaining_value).toBe(FACE);
  });
});

describe("single-use vouchers", () => {
  test("a percent wallet closes after one spend", async () => {
    voucherStubs.walletById = fixedWallet({
      discount_type: "percent",
      discount_value: 10,
      remaining_value: 10,
      max_discount: 0,
    });
    const result = await redeemWallet({
      walletId: VOUCHER_WALLET_ID,
      userId: VOUCHER_CUSTOMER_ID,
      subtotal: 500_000,
      kind: "order",
      orderId: "order-1",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.discount).toBe(50_000);
    expect(result.data.wallet.status).toBe("used");
  });
});
