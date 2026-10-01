import { beforeEach, describe, expect, mock, test } from "bun:test";
import { GUEST_CART_TTL_SECONDS } from "@/lib/auth/guest-session";
import type { CartRow } from "@/lib/orders/orders.types";
import { makeCartRow, makePartRow } from "../helpers/parts.fixtures";
import {
  cartRepoMocks,
  cartStubs,
  partRepoMocks,
  partStubs,
  resetPartsMocks,
} from "../helpers/parts.mocks";

// Cart service against stubbed repositories: guest carts only differ from
// account carts by the TTL on writes and by the merge step on login.
mock.module("@/lib/orders/cart.repository", () => cartRepoMocks);
mock.module("@/lib/parts/parts.repository", () => partRepoMocks);

import {
  addToCart,
  mergeGuestCart,
  updateCartItemQty,
} from "@/lib/orders/cart.service";

const GUEST = "99999999-9999-4999-8999-999999999999";
const ACCOUNT = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const PART_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

type UpsertParams = {
  customerId: string;
  partId: string;
  qty: number;
  ttlSeconds?: number;
};

function upsertCalls(): UpsertParams[] {
  return cartRepoMocks.upsertCartItem.mock.calls.map(
    (call) => call[0] as UpsertParams,
  );
}

beforeEach(() => {
  resetPartsMocks();
  // mockClear keeps the last implementation: restore the shared default so
  // mockImplementationOnce queues stay scoped to a single test.
  cartRepoMocks.listCartRows.mockImplementation(async () => cartStubs.cartRows);
});

describe("guest cart TTL", () => {
  test("addToCart forwards the row TTL to the repository", async () => {
    partStubs.partById = makePartRow({ part_id: PART_ID, stock_qty: 10 });
    const result = await addToCart(GUEST, PART_ID, 1, GUEST_CART_TTL_SECONDS);
    expect(result.ok).toBe(true);
    expect(upsertCalls()[0]).toMatchObject({
      customerId: GUEST,
      ttlSeconds: GUEST_CART_TTL_SECONDS,
    });
  });

  test("addToCart omits TTL for account carts", async () => {
    partStubs.partById = makePartRow({ part_id: PART_ID, stock_qty: 10 });
    await addToCart(ACCOUNT, PART_ID, 1);
    expect(upsertCalls()[0]?.ttlSeconds).toBeUndefined();
  });

  test("updateCartItemQty forwards the row TTL to the repository", async () => {
    cartStubs.cartRows = [makeCartRow({ customer_id: GUEST })];
    partStubs.partById = makePartRow({ part_id: PART_ID, stock_qty: 10 });
    const result = await updateCartItemQty(
      GUEST,
      PART_ID,
      3,
      GUEST_CART_TTL_SECONDS,
    );
    expect(result.ok).toBe(true);
    expect(upsertCalls()[0]).toMatchObject({
      qty: 3,
      ttlSeconds: GUEST_CART_TTL_SECONDS,
    });
  });
});

describe("mergeGuestCart", () => {
  test("is a no-op when the guest token matches the account", async () => {
    await mergeGuestCart(ACCOUNT, ACCOUNT);
    expect(cartRepoMocks.listCartRows).not.toHaveBeenCalled();
  });

  test("does nothing when the guest cart is empty", async () => {
    cartStubs.cartRows = [];
    await mergeGuestCart(GUEST, ACCOUNT);
    expect(cartRepoMocks.upsertCartItem).not.toHaveBeenCalled();
    expect(cartRepoMocks.clearCartRows).not.toHaveBeenCalled();
  });

  test("merges quantities, caps by stock, then drops the guest partition", async () => {
    const guestRow: CartRow = makeCartRow({ customer_id: GUEST, qty: 8 });
    const accountRow: CartRow = makeCartRow({
      customer_id: ACCOUNT,
      qty: 4,
    });
    cartRepoMocks.listCartRows
      .mockImplementationOnce(async () => [guestRow])
      .mockImplementationOnce(async () => [accountRow]);
    // 8 + 4 = 12 but only 9 in stock.
    partStubs.partById = makePartRow({ part_id: PART_ID, stock_qty: 9 });

    await mergeGuestCart(GUEST, ACCOUNT);

    expect(upsertCalls()).toHaveLength(1);
    expect(upsertCalls()[0]).toMatchObject({
      customerId: ACCOUNT,
      partId: PART_ID,
      qty: 9,
    });
    // Merged rows are account rows: no TTL is passed so they persist.
    expect(upsertCalls()[0]?.ttlSeconds).toBeUndefined();
    expect(cartRepoMocks.clearCartRows.mock.calls[0]).toEqual([GUEST]);
  });

  test("skips parts with no stock instead of writing zero rows", async () => {
    cartRepoMocks.listCartRows
      .mockImplementationOnce(async () => [makeCartRow({ customer_id: GUEST })])
      .mockImplementationOnce(async () => []);
    partStubs.partById = makePartRow({ part_id: PART_ID, stock_qty: 0 });

    await mergeGuestCart(GUEST, ACCOUNT);

    expect(cartRepoMocks.upsertCartItem).not.toHaveBeenCalled();
    expect(cartRepoMocks.clearCartRows.mock.calls[0]).toEqual([GUEST]);
  });
});
