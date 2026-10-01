// Checkout spends account-bound wallets: discount math, simulated
// totals, guest rejection and rollback keep storage consistent.
import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { CheckoutInput } from "@/lib/orders/orders.types";
import { makeCartRow, makeOrderRow } from "../helpers/parts.fixtures";
import {
  cartRepoMocks,
  cartStubs,
  orderLinesServiceMocks,
  orderLinesStubs,
  orderRepoMocks,
  orderStubs,
  orderWriteRepoMocks,
  resetServiceMocks,
  voucherCampaignRepoMocks,
  voucherRealtimeMocks,
  voucherStubs,
  voucherWalletRepoMocks,
} from "../helpers/service-mocks";
import {
  makeCampaignRow,
  makeWalletRow,
  VOUCHER_CUSTOMER_ID,
  VOUCHER_WALLET_ID,
} from "../helpers/voucher.fixtures";

// Helpers first, mocks second, system under test last.
mock.module("@/lib/orders/cart.repository", () => cartRepoMocks);
mock.module("@/lib/orders/order-lines.service", () => orderLinesServiceMocks);
mock.module("@/lib/orders/orders.repository", () => orderRepoMocks);
mock.module("@/lib/orders/orders-write.repository", () => orderWriteRepoMocks);
mock.module(
  "@/lib/vouchers/voucher-campaign.repository",
  () => voucherCampaignRepoMocks,
);
mock.module(
  "@/lib/vouchers/voucher-wallet.repository",
  () => voucherWalletRepoMocks,
);
mock.module("@/lib/vouchers/voucher-realtime", () => voucherRealtimeMocks);

import { checkoutCart, checkoutGuestCart } from "@/lib/orders/checkout.service";

function pickupInput(overrides?: Partial<CheckoutInput>): CheckoutInput {
  return {
    recipientName: "Nguyen Van A",
    phone: "0901234567",
    fulfillment: "pickup",
    address: "",
    addressLat: null,
    addressLng: null,
    province: "",
    district: "",
    ward: "",
    street: "",
    paymentMethod: "counter",
    ...overrides,
  };
}

function lastInsert(): Record<string, unknown> {
  const calls = orderWriteRepoMocks.insertOrder.mock.calls;
  return (calls[calls.length - 1]?.[0] ?? {}) as Record<string, unknown>;
}

beforeEach(() => {
  resetServiceMocks();
  cartStubs.cartRows = [makeCartRow({ qty: 1 })];
  voucherStubs.campaignById = makeCampaignRow();
  voucherStubs.walletById = makeWalletRow();
  voucherStubs.userCampaignCount = 0;
  orderStubs.orderById = makeOrderRow({
    customer_id: VOUCHER_CUSTOMER_ID,
    subtotal: 500000,
    shipping_fee: 0,
    discount: 50000,
    total: 450000,
    coupon_code: VOUCHER_WALLET_ID,
  });
});

describe("checkoutCart with wallet", () => {
  test("applies the voucher and writes simulated discounted totals", async () => {
    const result = await checkoutCart(
      VOUCHER_CUSTOMER_ID,
      pickupInput({ walletId: VOUCHER_WALLET_ID }),
      "an@example.com",
    );

    expect(result.ok).toBe(true);
    const insert = lastInsert();
    expect(insert.discount).toBe(50000);
    expect(insert.couponCode).toBe(VOUCHER_WALLET_ID);
    expect(insert.total).toBe(450000);
    // The wallet is spent on this order and the cart is cleared.
    expect(voucherStubs.statusMarks).toMatchObject([
      { walletId: VOUCHER_WALLET_ID, status: "used" },
    ]);
    expect(cartRepoMocks.clearCartRows.mock.calls.length).toBe(1);
    expect(voucherRealtimeMocks.publishWalletChange.mock.calls.length).toBe(1);
  });

  test("no wallet keeps the legacy zero-discount insert", async () => {
    const result = await checkoutCart(
      VOUCHER_CUSTOMER_ID,
      pickupInput(),
      "an@example.com",
    );

    expect(result.ok).toBe(true);
    const insert = lastInsert();
    expect(insert.discount).toBe(0);
    expect(insert.couponCode).toBeNull();
    expect(voucherStubs.statusMarks).toHaveLength(0);
  });

  test("another account wallet is rejected without touching storage", async () => {
    voucherStubs.walletById = makeWalletRow({ user_id: "other-customer" });

    const result = await checkoutCart(
      VOUCHER_CUSTOMER_ID,
      pickupInput({ walletId: VOUCHER_WALLET_ID }),
      "an@example.com",
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(404);
    expect(orderWriteRepoMocks.insertOrder.mock.calls.length).toBe(0);
    expect(voucherStubs.statusMarks).toHaveLength(0);
    expect(cartRepoMocks.clearCartRows.mock.calls.length).toBe(0);
  });

  test("wrong-scope campaign is rejected without touching storage", async () => {
    voucherStubs.campaignById = makeCampaignRow({ scope: "booking" });

    const result = await checkoutCart(
      VOUCHER_CUSTOMER_ID,
      pickupInput({ walletId: VOUCHER_WALLET_ID }),
      "an@example.com",
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(orderWriteRepoMocks.insertOrder.mock.calls.length).toBe(0);
    expect(voucherStubs.statusMarks).toHaveLength(0);
  });

  test("subtotal below the minimum is rejected without touching storage", async () => {
    voucherStubs.campaignById = makeCampaignRow({ min_order: 99999999 });

    const result = await checkoutCart(
      VOUCHER_CUSTOMER_ID,
      pickupInput({ walletId: VOUCHER_WALLET_ID }),
      "an@example.com",
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(orderWriteRepoMocks.insertOrder.mock.calls.length).toBe(0);
  });

  test("a failed insert releases the reservation so the voucher survives", async () => {
    orderWriteRepoMocks.insertOrder.mockImplementationOnce(async () => {
      throw new Error("db down");
    });

    await expect(
      checkoutCart(
        VOUCHER_CUSTOMER_ID,
        pickupInput({ walletId: VOUCHER_WALLET_ID }),
        "an@example.com",
      ),
    ).rejects.toThrow();
    const marks = voucherStubs.statusMarks.map((mark) => mark.status);
    expect(marks).toEqual(["used", "active"]);
    expect(cartRepoMocks.clearCartRows.mock.calls.length).toBe(0);
  });
});

describe("checkoutGuestCart with wallet", () => {
  test("guests cannot spend wallets and write nothing", async () => {
    const result = await checkoutGuestCart(
      "guest-partition",
      pickupInput({ walletId: VOUCHER_WALLET_ID }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(orderWriteRepoMocks.insertOrder.mock.calls.length).toBe(0);
    expect(voucherStubs.statusMarks).toHaveLength(0);
    expect(orderLinesStubs.reserveError).toBeNull();
  });
});
