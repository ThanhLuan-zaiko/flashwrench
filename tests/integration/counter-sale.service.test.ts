import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  makeOrderHistoryRow,
  makeOrderItemRow,
  makeOrderRow,
  makePartRow,
} from "../helpers/parts.fixtures";
import {
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
mock.module("@/lib/orders/orders.repository", () => orderRepoMocks);
mock.module("@/lib/orders/orders-write.repository", () => orderWriteRepoMocks);

import { createCounterSale } from "@/lib/orders/counter-sale.service";

const STAFF = "d1d1d1d1-d1d1-4d1d-8d1d-d1d1d1d1d1d1";
const PART_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

beforeEach(() => {
  resetServiceMocks();
});

describe("createCounterSale", () => {
  test("rejects an empty sale before touching inventory", async () => {
    const result = await createCounterSale(STAFF, { lines: [] });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(result.errors.lines).toBeTruthy();
    expect(partRepoMocks.findPartRowById).not.toHaveBeenCalled();
    expect(orderWriteRepoMocks.insertOrder).not.toHaveBeenCalled();
  });

  test("rejects malformed line quantities", async () => {
    const result = await createCounterSale(STAFF, {
      lines: [{ partId: PART_ID, quantity: 0 }],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.lines).toBeTruthy();
    expect(orderWriteRepoMocks.insertOrder).not.toHaveBeenCalled();
  });

  test("rejects a part that is no longer sellable", async () => {
    partStubs.partById = makePartRow({ is_active: false });
    const result = await createCounterSale(STAFF, {
      lines: [{ partId: PART_ID, quantity: 1 }],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(409);
    expect(orderWriteRepoMocks.insertOrder).not.toHaveBeenCalled();
  });

  test("creates a delivered + paid pickup order without a customer", async () => {
    partStubs.partById = makePartRow({ stock_qty: 10 });
    orderStubs.orderById = makeOrderRow({
      status: "delivered",
      payment_status: "paid",
      fulfillment_type: "pickup",
      customer_id: null,
    });
    orderStubs.itemRows = [makeOrderItemRow()];
    orderStubs.historyRows = [makeOrderHistoryRow()];

    const result = await createCounterSale(STAFF, {
      customerName: "Khach le",
      lines: [{ partId: PART_ID, quantity: 2 }],
    });
    expect(result.ok).toBe(true);
    const insert = orderWriteRepoMocks.insertOrder.mock.calls[0]?.at(0) as {
      customerId: string | null;
      customerName: string;
      status: string;
      paymentStatus: string;
      fulfillmentType: string;
      shippingFee: number;
      subtotal: number;
      total: number;
    } | null;
    expect(insert).toMatchObject({
      customerId: null,
      customerName: "Khach le",
      status: "delivered",
      paymentStatus: "paid",
      fulfillmentType: "pickup",
      shippingFee: 0,
      subtotal: 240000,
      total: 240000,
    });
    // Stock is decremented through the shared reservation path.
    expect(partInventoryRepoMocks.decrementPartStockCas).toHaveBeenCalled();
  });

  test("defaults the customer name for anonymous walk-ins", async () => {
    partStubs.partById = makePartRow();
    orderStubs.orderById = makeOrderRow();
    const result = await createCounterSale(STAFF, {
      lines: [{ partId: PART_ID, quantity: 1 }],
    });
    expect(result.ok).toBe(true);
    const insert = orderWriteRepoMocks.insertOrder.mock.calls[0]?.at(0) as {
      customerName: string;
    } | null;
    expect(insert?.customerName).toBe("Khách mua tại quầy");
  });
});
