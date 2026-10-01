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

// Guest checkout suite: same mock harness as checkout.service.test.ts,
// split out because that file hit the 350-line limit. checkoutGuestCart
// buys with the fw_gid token partition and leaves customer_id null.
mock.module("@/lib/parts/parts.repository", () => partRepoMocks);
mock.module(
  "@/lib/parts/parts-inventory.repository",
  () => partInventoryRepoMocks,
);
mock.module("@/lib/media/media.service", () => partsMediaServiceMocks);
mock.module("@/lib/orders/cart.repository", () => cartRepoMocks);
mock.module("@/lib/orders/orders.repository", () => orderRepoMocks);
mock.module("@/lib/orders/orders-write.repository", () => orderWriteRepoMocks);

import { checkoutGuestCart } from "@/lib/orders/checkout.service";

const GUEST = "99999999-9999-4999-8999-999999999999";

beforeEach(() => {
  resetServiceMocks();
});

describe("checkoutGuestCart", () => {
  test("requires an email before reading the cart", async () => {
    const result = await checkoutGuestCart(GUEST, makeCheckoutInput());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(result.errors.email).toBeTruthy();
    expect(cartRepoMocks.listCartRows).not.toHaveBeenCalled();
  });

  test("rejects a malformed email", async () => {
    const result = await checkoutGuestCart(
      GUEST,
      makeCheckoutInput({ email: "khong-phai-email" }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.email).toBeTruthy();
    expect(orderWriteRepoMocks.insertOrder).not.toHaveBeenCalled();
  });

  test("stores the guest contact snapshot with customer_id null", async () => {
    cartStubs.cartRows = [makeCartRow({ customer_id: GUEST })];
    partStubs.partById = makePartRow();
    orderStubs.orderById = makeOrderRow({
      customer_id: null,
      customer_email: "khach@example.com",
    });
    orderStubs.itemRows = [makeOrderItemRow()];
    orderStubs.historyRows = [makeOrderHistoryRow()];

    const result = await checkoutGuestCart(
      GUEST,
      makeCheckoutInput({ email: " Khach@Example.COM " }),
    );
    expect(result.ok).toBe(true);
    const insert = orderWriteRepoMocks.insertOrder.mock.calls[0]?.at(0) as {
      customerId: string | null;
      customerEmail: string | null;
      createdBy: string | null;
      historyNote: string;
    } | null;
    expect(insert).toMatchObject({
      customerId: null,
      customerEmail: "khach@example.com",
      createdBy: null,
    });
    expect(insert?.historyNote).toContain("khách vãng lai");
    // The guest partition is cleared, not the account one.
    expect(cartRepoMocks.clearCartRows.mock.calls[0]).toEqual([GUEST]);
  });

  test("reads the guest token cart partition", async () => {
    cartStubs.cartRows = [makeCartRow({ customer_id: GUEST })];
    partStubs.partById = makePartRow();
    orderStubs.orderById = makeOrderRow({ customer_id: null });
    orderStubs.itemRows = [makeOrderItemRow()];
    orderStubs.historyRows = [makeOrderHistoryRow()];

    await checkoutGuestCart(GUEST, makeCheckoutInput({ email: "a@b.co" }));
    expect(cartRepoMocks.listCartRows.mock.calls[0]).toEqual([GUEST]);
  });
});
