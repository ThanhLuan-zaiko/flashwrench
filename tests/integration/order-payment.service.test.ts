import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  makeOrderHistoryRow,
  makeOrderItemRow,
  makeOrderRow,
} from "../helpers/parts.fixtures";
import {
  orderDeliveryRepoMocks,
  orderDeliveryStubs,
  orderRepoMocks,
  orderStubs,
  orderWriteRepoMocks,
  partRepoMocks,
  resetServiceMocks,
} from "../helpers/service-mocks";
import { makePaymentReceiptRow } from "../helpers/workspace.fixtures";
import {
  paymentRepoMocks,
  resetWorkspaceMocks,
  workspaceStubs,
} from "../helpers/workspace.mocks";

// Helpers first, mocks second, system under test last.
mock.module("@/lib/parts/parts.repository", () => partRepoMocks);
mock.module("@/lib/orders/orders.repository", () => orderRepoMocks);
mock.module("@/lib/orders/orders-write.repository", () => orderWriteRepoMocks);
mock.module(
  "@/lib/orders/orders-delivery.repository",
  () => orderDeliveryRepoMocks,
);
mock.module(
  "@/lib/payments/booking-payment.repository",
  () => paymentRepoMocks,
);

import {
  collectCounterPayment,
  getOrderInvoice,
  payOrderOnlineMock,
} from "@/lib/orders/order-payment.service";

const CUSTOMER = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const STAFF = "d1d1d1d1-d1d1-4d1d-8d1d-d1d1d1d1d1d1";
const ORDER_ID = "ffffffff-ffff-4fff-8fff-ffffffffffff";
const PAYMENT_ID = "99999999-9999-4999-8999-999999999999";

beforeEach(() => {
  resetServiceMocks();
  resetWorkspaceMocks();
});

type PaymentCall = {
  paymentStatus: string;
  paidAt: Date | null;
  paymentRefs: { paymentId: string; createdAt: Date }[];
  providerRef?: string | null;
};

function lastPaymentCall(): PaymentCall | null {
  const calls = orderDeliveryRepoMocks.markOrderPaymentStatus.mock.calls;
  return (calls.at(-1)?.[0] as PaymentCall | undefined) ?? null;
}

function lastHistoryNote(): string | null {
  const calls = orderWriteRepoMocks.insertOrderHistory.mock.calls;
  const call = calls.at(-1)?.[0] as { note: string } | undefined;
  return call?.note ?? null;
}

function givenPayableOrder(overrides: Parameters<typeof makeOrderRow>[0]) {
  orderStubs.orderById = makeOrderRow(overrides);
  orderStubs.itemRows = [makeOrderItemRow()];
  orderStubs.historyRows = [makeOrderHistoryRow()];
  orderDeliveryStubs.paymentRefs = [
    { paymentId: PAYMENT_ID, createdAt: new Date("2026-01-05T00:00:00.000Z") },
  ];
}

describe("payOrderOnlineMock", () => {
  test("rejects a malformed order id without touching storage", async () => {
    const result = await payOrderOnlineMock(CUSTOMER, "not-a-uuid");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(orderRepoMocks.findOrderRowById).not.toHaveBeenCalled();
    expect(
      orderDeliveryRepoMocks.markOrderPaymentStatus,
    ).not.toHaveBeenCalled();
  });

  test("404 when the order does not exist", async () => {
    orderStubs.orderById = null;
    const result = await payOrderOnlineMock(CUSTOMER, ORDER_ID);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(404);
  });

  test("403 when the order belongs to someone else", async () => {
    orderStubs.orderById = makeOrderRow({
      customer_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      payment_method: "bank_transfer",
    });
    const result = await payOrderOnlineMock(CUSTOMER, ORDER_ID);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(403);
    expect(
      orderDeliveryRepoMocks.markOrderPaymentStatus,
    ).not.toHaveBeenCalled();
  });

  test("400 when the order is not an online-payment order", async () => {
    orderStubs.orderById = makeOrderRow({ payment_method: "cod" });
    const result = await payOrderOnlineMock(CUSTOMER, ORDER_ID);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(result.errors.paymentMethod).toBeTruthy();
    expect(
      orderDeliveryRepoMocks.markOrderPaymentStatus,
    ).not.toHaveBeenCalled();
  });

  test("409 when the order is already paid", async () => {
    orderStubs.orderById = makeOrderRow({
      payment_method: "bank_transfer",
      payment_status: "paid",
    });
    const result = await payOrderOnlineMock(CUSTOMER, ORDER_ID);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(409);
    expect(
      orderDeliveryRepoMocks.markOrderPaymentStatus,
    ).not.toHaveBeenCalled();
  });

  test("400 for terminal statuses, storage untouched", async () => {
    for (const status of ["delivered", "cancelled", "refunded"] as const) {
      orderStubs.orderById = makeOrderRow({
        status,
        payment_method: "bank_transfer",
        payment_status: "unpaid",
      });
      const result = await payOrderOnlineMock(CUSTOMER, ORDER_ID);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.status).toBe(400);
      expect(
        orderDeliveryRepoMocks.markOrderPaymentStatus,
      ).not.toHaveBeenCalled();
    }
  });

  test("settles the order paid with a MOCK provider ref and timeline note", async () => {
    givenPayableOrder({
      status: "pending",
      payment_method: "bank_transfer",
      payment_status: "unpaid",
    });
    const result = await payOrderOnlineMock(CUSTOMER, ORDER_ID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const paymentCall = lastPaymentCall();
    expect(paymentCall?.paymentStatus).toBe("paid");
    expect(paymentCall?.paidAt).toBeInstanceOf(Date);
    expect(paymentCall?.paymentRefs).toHaveLength(1);
    expect(paymentCall?.providerRef).toMatch(/^MOCK-[0-9A-F]{8}$/);
    expect(result.data.providerRef).toBe(paymentCall?.providerRef ?? null);
    expect(result.data.paidAt).toBeTruthy();
    expect(lastHistoryNote()).toContain("Thanh toán online (giả lập)");
    expect(lastHistoryNote()).toContain(paymentCall?.providerRef ?? "");
    expect(result.data.order.id).toBe(ORDER_ID);
  });
});

describe("collectCounterPayment", () => {
  test("rejects a malformed order id", async () => {
    const result = await collectCounterPayment(STAFF, "not-a-uuid");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(orderRepoMocks.findOrderRowById).not.toHaveBeenCalled();
  });

  test("404 when the order does not exist", async () => {
    orderStubs.orderById = null;
    const result = await collectCounterPayment(STAFF, ORDER_ID);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(404);
  });

  test("400 when the order is not a counter order", async () => {
    orderStubs.orderById = makeOrderRow({ payment_method: "cod" });
    const result = await collectCounterPayment(STAFF, ORDER_ID);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(result.errors.paymentMethod).toBeTruthy();
    expect(
      orderDeliveryRepoMocks.markOrderPaymentStatus,
    ).not.toHaveBeenCalled();
  });

  test("409 when the counter order is already paid", async () => {
    orderStubs.orderById = makeOrderRow({
      payment_method: "counter",
      payment_status: "paid",
    });
    const result = await collectCounterPayment(STAFF, ORDER_ID);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(409);
    expect(
      orderDeliveryRepoMocks.markOrderPaymentStatus,
    ).not.toHaveBeenCalled();
  });

  test("collects an unpaid counter order without a provider ref", async () => {
    givenPayableOrder({
      status: "confirmed",
      payment_method: "counter",
      payment_status: "unpaid",
      fulfillment_type: "pickup",
    });
    const result = await collectCounterPayment(STAFF, ORDER_ID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const paymentCall = lastPaymentCall();
    expect(paymentCall?.paymentStatus).toBe("paid");
    expect(paymentCall?.paidAt).toBeInstanceOf(Date);
    expect(paymentCall?.providerRef).toBeUndefined();
    expect(result.data.providerRef).toBeNull();
    expect(lastHistoryNote()).toBe("Thu tiền tại quầy");
  });
});

describe("getOrderInvoice", () => {
  test("rejects a malformed order id without touching storage", async () => {
    const result = await getOrderInvoice("not-a-uuid");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(orderRepoMocks.findOrderRowById).not.toHaveBeenCalled();
  });

  test("404 when the order does not exist", async () => {
    orderStubs.orderById = null;
    const result = await getOrderInvoice(ORDER_ID);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(404);
  });

  test("returns the order with payment null when no refs exist", async () => {
    orderStubs.orderById = makeOrderRow();
    orderStubs.itemRows = [makeOrderItemRow()];
    orderStubs.historyRows = [];
    orderDeliveryStubs.paymentRefs = [];
    const result = await getOrderInvoice(ORDER_ID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.order.id).toBe(ORDER_ID);
    expect(result.data.payment).toBeNull();
    expect(paymentRepoMocks.findPaymentRowById).not.toHaveBeenCalled();
  });

  test("maps the newest payment row into the invoice receipt", async () => {
    orderStubs.orderById = makeOrderRow();
    orderStubs.itemRows = [makeOrderItemRow()];
    orderStubs.historyRows = [];
    const OLDER = "11111111-1111-4111-8111-111111111111";
    orderDeliveryStubs.paymentRefs = [
      {
        paymentId: PAYMENT_ID,
        createdAt: new Date("2026-01-05T00:00:00.000Z"),
      },
      {
        paymentId: OLDER,
        createdAt: new Date("2026-01-04T00:00:00.000Z"),
      },
    ];
    workspaceStubs.paymentById = makePaymentReceiptRow({
      payment_id: PAYMENT_ID,
      ref_type: "order",
      ref_id: ORDER_ID,
      method: "bank_transfer",
      status: "paid",
      provider_ref: "MOCK-AB12CD34",
      amount: 550000,
    });
    const result = await getOrderInvoice(ORDER_ID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(paymentRepoMocks.findPaymentRowById).toHaveBeenCalledWith(
      PAYMENT_ID,
    );
    const payment = result.data.payment;
    expect(payment?.paymentId).toBe(PAYMENT_ID);
    expect(payment?.method).toBe("bank_transfer");
    expect(payment?.status).toBe("paid");
    expect(payment?.amount).toBe(550000);
    expect(payment?.providerRef).toBe("MOCK-AB12CD34");
    expect(payment?.paidAt).toBe("2026-09-16T10:00:00.000Z");
  });

  test("payment falls back to null when the referenced row is gone", async () => {
    orderStubs.orderById = makeOrderRow();
    orderStubs.itemRows = [makeOrderItemRow()];
    orderStubs.historyRows = [];
    orderDeliveryStubs.paymentRefs = [
      {
        paymentId: PAYMENT_ID,
        createdAt: new Date("2026-01-05T00:00:00.000Z"),
      },
    ];
    workspaceStubs.paymentById = null;
    const result = await getOrderInvoice(ORDER_ID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.payment).toBeNull();
  });
});
