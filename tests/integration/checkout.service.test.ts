import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  makeCartRow,
  makeCheckoutInput,
  makeOrderHistoryRow,
  makeOrderItemRow,
  makeOrderRow,
  makePartRow,
} from "../helpers/parts.fixtures";
import {
  cartRepoMocks,
  cartStubs,
  orderRepoMocks,
  orderStubs,
  orderWriteRepoMocks,
  partInventoryRepoMocks,
  partRepoMocks,
  partStubs,
  partsMediaServiceMocks,
  resetServiceMocks,
} from "../helpers/service-mocks";

// Helpers first, mocks second, system under test last.
mock.module("@/lib/parts/parts.repository", () => partRepoMocks);
mock.module(
  "@/lib/parts/parts-inventory.repository",
  () => partInventoryRepoMocks,
);
mock.module("@/lib/media/media.service", () => partsMediaServiceMocks);
mock.module("@/lib/orders/cart.repository", () => cartRepoMocks);
mock.module("@/lib/orders/orders.repository", () => orderRepoMocks);
mock.module("@/lib/orders/orders-write.repository", () => orderWriteRepoMocks);

import {
  checkoutCart,
  FREE_SHIPPING_THRESHOLD,
  ORDER_SHIPPING_FEE,
} from "@/lib/orders/checkout.service";

const CUSTOMER = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

beforeEach(() => {
  resetServiceMocks();
});

describe("checkoutCart", () => {
  test("rejects malformed input before reading the cart", async () => {
    const result = await checkoutCart(CUSTOMER, {
      ...makeCheckoutInput(),
      phone: "abc",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(cartRepoMocks.listCartRows).not.toHaveBeenCalled();
  });

  test("rejects an empty cart", async () => {
    cartStubs.cartRows = [];
    const result = await checkoutCart(CUSTOMER, makeCheckoutInput());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(orderWriteRepoMocks.insertOrder).not.toHaveBeenCalled();
  });

  test("rejects when a carted part is no longer sellable", async () => {
    cartStubs.cartRows = [makeCartRow()];
    partStubs.partById = makePartRow({ is_active: false });
    const result = await checkoutCart(CUSTOMER, makeCheckoutInput());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(409);
    expect(orderWriteRepoMocks.insertOrder).not.toHaveBeenCalled();
  });

  test("rejects when a carted part disappeared entirely", async () => {
    cartStubs.cartRows = [makeCartRow()];
    partStubs.partById = null;
    const result = await checkoutCart(CUSTOMER, makeCheckoutInput());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(409);
  });

  test("rolls back earlier decrements when a later line lacks stock", async () => {
    const partA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const partB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    cartStubs.cartRows = [
      makeCartRow({ part_id: partA, qty: 2 }),
      makeCartRow({ part_id: partB, part_name: "Bugi", qty: 5 }),
    ];
    partStubs.partsById = {
      [partA]: makePartRow({ part_id: partA, stock_qty: 10 }),
      [partB]: makePartRow({ part_id: partB, stock_qty: 2 }),
    };
    const result = await checkoutCart(CUSTOMER, makeCheckoutInput());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(409);
    // A was decremented then restocked; the order must not be written.
    expect(partInventoryRepoMocks.decrementPartStockCas.mock.calls[0]).toEqual([
      partA,
      10,
      8,
    ]);
    const restockCall = partInventoryRepoMocks.setPartStock.mock.calls[0];
    expect(restockCall?.slice(0, 4)).toEqual([
      partA,
      makePartRow().category_id,
      makePartRow().created_at,
      12,
    ]);
    expect(orderWriteRepoMocks.insertOrder).not.toHaveBeenCalled();
    expect(cartRepoMocks.clearCartRows).not.toHaveBeenCalled();
  });

  test("creates the order, clears the cart and charges the flat fee", async () => {
    const part = makePartRow();
    cartStubs.cartRows = [makeCartRow({ qty: 2 })];
    partStubs.partById = part;
    orderStubs.orderById = makeOrderRow();
    orderStubs.itemRows = [makeOrderItemRow()];
    orderStubs.historyRows = [makeOrderHistoryRow()];

    const result = await checkoutCart(CUSTOMER, makeCheckoutInput());
    expect(result.ok).toBe(true);
    const insert = orderWriteRepoMocks.insertOrder.mock.calls[0]?.at(0) as {
      subtotal: number;
      shippingFee: number;
      total: number;
      lines: { quantity: number; unitPrice: number; lineTotal: number }[];
    } | null;
    expect(insert).toBeTruthy();
    // 2 x 120000 = 240000 subtotal, below the free-shipping threshold.
    expect(insert?.subtotal).toBe(240000);
    expect(insert?.shippingFee).toBe(ORDER_SHIPPING_FEE);
    expect(insert?.total).toBe(270000);
    expect(insert?.lines[0]?.quantity).toBe(2);
    expect(partInventoryRepoMocks.decrementPartStockCas.mock.calls[0]).toEqual([
      part.part_id,
      10,
      8,
    ]);
    expect(cartRepoMocks.clearCartRows.mock.calls[0]).toEqual([CUSTOMER]);
  });

  test("ships free at or above the threshold", async () => {
    cartStubs.cartRows = [makeCartRow({ qty: 5 })];
    partStubs.partById = makePartRow({ price: FREE_SHIPPING_THRESHOLD / 5 });
    orderStubs.orderById = makeOrderRow();
    orderStubs.itemRows = [makeOrderItemRow()];
    orderStubs.historyRows = [makeOrderHistoryRow()];
    const result = await checkoutCart(CUSTOMER, makeCheckoutInput());
    expect(result.ok).toBe(true);
    const insert = orderWriteRepoMocks.insertOrder.mock.calls[0]?.at(0) as {
      shippingFee: number;
    } | null;
    expect(insert?.shippingFee).toBe(0);
  });
});
