import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makePublicUser } from "../helpers/auth.fixtures";
import {
  completedBooking,
  paymentMechanic,
} from "../helpers/booking-payment.fixtures";
import {
  CUSTOMER_ID as BOOKING_CUSTOMER,
  BOOKING_ID,
} from "../helpers/mechanic.fixtures";
import { mechanicStubs } from "../helpers/mechanic.mocks";
import { makeOrderRow } from "../helpers/parts.fixtures";
import {
  autoGrantServiceMocks,
  mechanicBookingsRepoMocks,
  orderDeliveryRepoMocks,
  orderDeliveryStubs,
  orderRepoMocks,
  orderRevenueMocks,
  orderStubs,
  orderWriteRepoMocks,
  partCategoryRepoMocks,
  partInventoryRepoMocks,
  partRepoMocks,
  partsMediaServiceMocks,
  resetServiceMocks,
  serviceStubs,
  userRepoMocks,
} from "../helpers/service-mocks";
import {
  domainPublishMocks,
  paymentPromptRepoMocks,
  paymentPromptStubs,
  paymentRepoMocks,
  realtimePublishMocks,
  rescuePaymentRepoMocks,
  revenueServiceMocks,
  workspaceStubs,
} from "../helpers/workspace.mocks";

// Helpers first, mocks second, system under test last.
mock.module(
  "@/lib/mechanic/mechanic-bookings.repository",
  () => mechanicBookingsRepoMocks,
);
mock.module("@/lib/parts/parts.repository", () => partRepoMocks);
mock.module(
  "@/lib/parts/parts-inventory.repository",
  () => partInventoryRepoMocks,
);
mock.module(
  "@/lib/parts/part-categories.repository",
  () => partCategoryRepoMocks,
);
mock.module("@/lib/media/media.service", () => partsMediaServiceMocks);
mock.module("@/lib/orders/orders.repository", () => orderRepoMocks);
mock.module("@/lib/orders/orders-write.repository", () => orderWriteRepoMocks);
mock.module(
  "@/lib/orders/orders-delivery.repository",
  () => orderDeliveryRepoMocks,
);
mock.module("@/lib/auth/user.repository", () => userRepoMocks);
mock.module("@/lib/orders/order-revenue", () => orderRevenueMocks);
mock.module("@/lib/orders/order-wallet-restore", () => ({
  refundOrderWallet: mock(async () => undefined),
}));
mock.module("@/lib/vouchers/auto-grant.service", () => autoGrantServiceMocks);
mock.module(
  "@/lib/payments/payment-prompt.repository",
  () => paymentPromptRepoMocks,
);
mock.module(
  "@/lib/payments/booking-payment.repository",
  () => paymentRepoMocks,
);
mock.module("@/lib/rescue/rescue-payment.repository", () => ({
  ...rescuePaymentRepoMocks,
}));
mock.module("@/lib/rescue/rescue-workflow.repository", () => ({
  findRescueRowById: mock(async () => null),
}));
mock.module("@/lib/realtime/domain-publish", () => domainPublishMocks);
mock.module("@/lib/realtime/publish", () => realtimePublishMocks);
mock.module("@/lib/revenue/revenue.service", () => revenueServiceMocks);

import { collectOrderDelivery } from "@/lib/orders/order-collect.service";
import {
  issueBookingPaymentCode,
  issueOrderPaymentCode,
} from "@/lib/payments/payment-code.service";
import { listPaymentPrompts } from "@/lib/payments/payment-prompt.service";

const CUSTOMER = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const ORDER_ID = "ffffffff-ffff-4fff-8fff-ffffffffffff";
const COURIER = makePublicUser({
  id: "c1c1c1c1-c1c1-4c1c-8c1c-c1c1c1c1c1c1",
  role: "mechanic",
});
const OTHER_MECHANIC = makePublicUser({
  id: "99999999-9999-4999-8999-999999999999",
  role: "mechanic",
});

function codShippingOrder() {
  return makeOrderRow({
    status: "shipping",
    courier_type: "mechanic",
    courier_id: COURIER.id,
    courier_name: "Tho A",
    payment_method: "cod",
    payment_status: "unpaid",
  });
}

beforeEach(() => {
  resetServiceMocks();
  orderStubs.orderById = codShippingOrder();
});

describe("issueOrderPaymentCode", () => {
  test("rejects non-collectors and foreign couriers", async () => {
    for (const actor of [
      makePublicUser({ role: "customer" }),
      OTHER_MECHANIC,
    ]) {
      const result = await issueOrderPaymentCode(actor, ORDER_ID);
      expect(result).toMatchObject({ ok: false, status: 403 });
    }
    expect(orderDeliveryRepoMocks.setOrderPaymentCode).not.toHaveBeenCalled();
    expect(paymentPromptRepoMocks.putPaymentPrompt).not.toHaveBeenCalled();
  });

  test("rejects orders that cannot collect COD at the door", async () => {
    orderStubs.orderById = { ...codShippingOrder(), status: "packing" };
    expect(await issueOrderPaymentCode(COURIER, ORDER_ID)).toMatchObject({
      ok: false,
      status: 400,
    });
    orderStubs.orderById = {
      ...codShippingOrder(),
      payment_method: "bank_transfer",
    };
    expect(await issueOrderPaymentCode(COURIER, ORDER_ID)).toMatchObject({
      ok: false,
      status: 400,
    });
    orderStubs.orderById = {
      ...codShippingOrder(),
      payment_status: "paid",
    };
    expect(await issueOrderPaymentCode(COURIER, ORDER_ID)).toMatchObject({
      ok: false,
      status: 409,
    });
  });

  test("stores a six-digit code, writes the customer prompt and publishes", async () => {
    const result = await issueOrderPaymentCode(COURIER, ORDER_ID);
    expect(result).toEqual({ ok: true, data: { issued: true } });

    const codeWrite = orderDeliveryStubs.paymentCodeSets[0];
    expect(codeWrite?.orderId).toBe(ORDER_ID);
    expect(codeWrite?.code).toMatch(/^\d{6}$/);

    expect(paymentPromptStubs.rows).toHaveLength(1);
    expect(paymentPromptStubs.rows[0]).toMatchObject({
      customer_id: CUSTOMER,
      ref_type: "order",
      ref_id: ORDER_ID,
      amount_due: 270000,
    });

    expect(
      workspaceStubs.auditEvents.some(
        (event) =>
          event.action === "confirm_code_issued" && event.refId === ORDER_ID,
      ),
    ).toBe(true);
    expect(
      workspaceStubs.published.some(
        (entry) =>
          entry.topic === `user:${CUSTOMER}` &&
          (entry.payload as { kind?: string }).kind === "order-updated",
      ),
    ).toBe(true);
  });
});

describe("collectOrderDelivery", () => {
  test("rejects collection before a code was issued", async () => {
    const result = await collectOrderDelivery(COURIER, ORDER_ID, {
      confirmCode: "123456",
    });
    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(orderWriteRepoMocks.updateOrderStatusRows).not.toHaveBeenCalled();
  });

  test("rejects a wrong code and records the audit trail", async () => {
    orderStubs.orderById = {
      ...codShippingOrder(),
      payment_confirm_code: "654321",
    };
    const result = await collectOrderDelivery(COURIER, ORDER_ID, {
      confirmCode: "123456",
    });
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(
      workspaceStubs.auditEvents.some(
        (event) =>
          event.action === "confirm_failed" && event.refId === ORDER_ID,
      ),
    ).toBe(true);
    expect(orderWriteRepoMocks.updateOrderStatusRows).not.toHaveBeenCalled();
  });

  test("settles delivered+paid on a matching code and clears the prompt", async () => {
    orderStubs.orderById = {
      ...codShippingOrder(),
      payment_confirm_code: "123456",
    };
    paymentPromptStubs.rows = [
      {
        customer_id: CUSTOMER,
        ref_type: "order",
        ref_id: ORDER_ID,
        title: "Đơn hàng",
        amount_due: 270000,
        issued_at: new Date("2026-01-05T00:00:00.000Z"),
      },
    ];

    const result = await collectOrderDelivery(COURIER, ORDER_ID, {
      confirmCode: "123456",
    });
    expect(result.ok).toBe(true);

    const statusCall = orderWriteRepoMocks.updateOrderStatusRows.mock
      .calls[0]?.[0] as { newStatus?: string } | undefined;
    expect(statusCall?.newStatus).toBe("delivered");
    const paymentCall = orderDeliveryRepoMocks.markOrderPaymentStatus.mock
      .calls[0]?.[0] as { paymentStatus?: string } | undefined;
    expect(paymentCall?.paymentStatus).toBe("paid");
    expect(serviceStubs.orderReceiptProjections).toEqual([ORDER_ID]);
    expect(paymentPromptStubs.rows).toHaveLength(0);
    // The code is wiped from the order row — it must never survive settle.
    expect(
      orderDeliveryStubs.paymentCodeSets.some(
        (entry) => entry.orderId === ORDER_ID && entry.code === null,
      ),
    ).toBe(true);
    expect(
      workspaceStubs.published.some(
        (entry) =>
          entry.topic === `user:${CUSTOMER}` &&
          (entry.payload as { kind?: string }).kind === "order-updated",
      ),
    ).toBe(true);
  });
});

describe("booking/rescue prompt integration", () => {
  test("issueBookingPaymentCode writes a prompt for the customer", async () => {
    mechanicStubs.bookingById = completedBooking({
      payment_confirm_code: null,
    });
    const result = await issueBookingPaymentCode(paymentMechanic, BOOKING_ID);
    expect(result).toEqual({ ok: true, data: { issued: true } });
    expect(paymentPromptStubs.rows[0]).toMatchObject({
      customer_id: BOOKING_CUSTOMER,
      ref_type: "booking",
      ref_id: BOOKING_ID,
      amount_due: 450000,
    });
    expect(
      workspaceStubs.published.some(
        (entry) =>
          (entry.payload as { kind?: string }).kind === "booking-updated",
      ),
    ).toBe(true);
  });

  test("listPaymentPrompts sweeps stale rows and returns live hrefs", async () => {
    paymentPromptStubs.rows = [
      {
        customer_id: CUSTOMER,
        ref_type: "order",
        ref_id: ORDER_ID,
        title: "Đơn hàng #ffffffff",
        amount_due: 270000,
        issued_at: new Date("2026-01-05T00:00:00.000Z"),
      },
      {
        customer_id: CUSTOMER,
        ref_type: "booking",
        ref_id: BOOKING_ID,
        title: "Sửa xe",
        amount_due: 100000,
        issued_at: new Date("2026-01-06T00:00:00.000Z"),
      },
    ];
    // Live order row: code issued, still unpaid.
    orderStubs.orderById = {
      ...codShippingOrder(),
      payment_confirm_code: "112233",
    };
    // Stale booking row: no live code anymore (already collected).
    mechanicStubs.bookingById = completedBooking({
      payment_confirm_code: null,
      payment_status: "paid",
    });

    const prompts = await listPaymentPrompts(CUSTOMER);
    expect(prompts).toHaveLength(1);
    expect(prompts[0]).toMatchObject({
      kind: "order",
      refId: ORDER_ID,
      href: `/orders/${ORDER_ID}`,
    });
    expect(paymentPromptStubs.rows).toHaveLength(1);
  });
});
