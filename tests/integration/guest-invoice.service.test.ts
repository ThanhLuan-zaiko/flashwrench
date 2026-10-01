import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  guestAccessRepoMocks,
  guestAccessStubs,
  resetGuestAccessMocks,
} from "../helpers/guest-access.mocks";
import {
  makeBookingItemRow,
  makeBookingRow,
} from "../helpers/mechanic.fixtures";
import {
  mechanicBookingsRepoMocks,
  mechanicStubs,
  resetMechanicMocks,
} from "../helpers/mechanic.mocks";
import { makeOrderRow } from "../helpers/parts.fixtures";
import {
  orderRepoMocks,
  orderStubs,
  resetPartsMocks,
} from "../helpers/parts.mocks";
import {
  makeRescueRow,
  rescueStubs,
  rescueWorkflowRepoMocks,
  resetRescueMocks,
} from "../helpers/rescue.mocks";

// Helpers first, mocks second, system under test last. The invoice builders
// are the only system under test; every reader below is a shared stub.
mock.module(
  "@/lib/guest-access/guest-access.repository",
  () => guestAccessRepoMocks,
);
mock.module(
  "@/lib/mechanic/mechanic-bookings.repository",
  () => mechanicBookingsRepoMocks,
);
mock.module(
  "@/lib/rescue/rescue-workflow.repository",
  () => rescueWorkflowRepoMocks,
);
mock.module("@/lib/orders/orders.repository", () => orderRepoMocks);

const paymentStubs = {
  /** Receipts keyed by ref_type, mirroring payments_by_id_ref. */
  rows: new Map<
    string,
    { payment_id: string; amount: number; status: string }[]
  >(),
};

mock.module("@/lib/payments/booking-payment.repository", () => ({
  listPaymentRefPaymentIds: mock(
    async (refType: string, refId: string): Promise<string[]> =>
      (paymentStubs.rows.get(`${refType}|${refId}`) ?? []).map(
        (r) => r.payment_id,
      ),
  ),
  findPaymentRowById: mock(async (id: string) => {
    for (const [key, rows] of paymentStubs.rows) {
      const hit = rows.find((r) => r.payment_id === id);
      if (hit) {
        const [refType, refId] = key.split("|");
        return {
          payment_id: hit.payment_id,
          ref_type: refType,
          ref_id: refId,
          customer_id: null,
          mechanic_id: null,
          amount: hit.amount,
          method: "cod",
          status: hit.status,
          provider_ref: null,
          recorded_by: null,
          customer_confirmed: true,
          paid_at: new Date("2026-09-15T09:00:00.000Z"),
          created_at: new Date("2026-09-15T09:00:00.000Z"),
        };
      }
    }
    return null;
  }),
}));

import { readGuestInvoice } from "@/lib/guest-access/guest-invoice.service";

const EMAIL = "an@example.com";
const BOOKING_ID = "11111111-1111-1111-1111-111111111111";
const RESCUE_ID = "22222222-2222-4222-8222-222222222222";
const ORDER_ID = "33333333-3333-4333-8333-333333333333";

beforeEach(() => {
  resetGuestAccessMocks();
  resetMechanicMocks();
  resetRescueMocks();
  resetPartsMocks();
  paymentStubs.rows.clear();
});

describe("readGuestInvoice ownership", () => {
  test("404 without a verified address", async () => {
    const result = await readGuestInvoice("", "booking", BOOKING_ID);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(401);
  });

  test("400 for a malformed id", async () => {
    const result = await readGuestInvoice(EMAIL, "booking", "nope");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
  });

  // Ownership is settled before any row is read, so an id from another
  // address must not even reach the builders.
  test("404 for a record the index does not list, without reading the row", async () => {
    const result = await readGuestInvoice(EMAIL, "booking", BOOKING_ID);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(404);
    expect(mechanicBookingsRepoMocks.findBookingRowById).not.toHaveBeenCalled();
  });
});

describe("readGuestInvoice booking", () => {
  beforeEach(() => {
    guestAccessStubs.refs = [
      {
        record_type: "booking",
        record_id: BOOKING_ID,
        created_at: new Date(),
        phone: null,
      },
    ];
  });

  test("builds lines, balance and installments from the real rows", async () => {
    mechanicStubs.bookingById = makeBookingRow({
      booking_id: BOOKING_ID,
      customer_id: null,
      total: 500000,
      status: "completed",
      payment_status: "partial",
    });
    mechanicStubs.itemRows = [
      makeBookingItemRow({ booking_id: BOOKING_ID, line_total: 450000 }),
    ];
    paymentStubs.rows.set(`booking|${BOOKING_ID}`, [
      { payment_id: "pay-1", amount: 200000, status: "paid" },
      { payment_id: "pay-2", amount: 50000, status: "paid" },
    ]);

    const result = await readGuestInvoice(EMAIL, "booking", BOOKING_ID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const invoice = result.data;

    expect(invoice.kind).toBe("booking");
    expect(invoice.reference).toBe(BOOKING_ID.slice(0, 8).toUpperCase());
    expect(invoice.lines).toHaveLength(1);
    expect(invoice.totals.subtotal).toBe(450000);
    // The 50k the item list does not explain surfaces as its own row
    // instead of being folded silently into the total.
    expect(invoice.totals.extraFee).toBe(50000);
    expect(invoice.totals.total).toBe(500000);
    expect(invoice.totals.paid).toBe(250000);
    expect(invoice.totals.outstanding).toBe(250000);
    expect(invoice.payments).toHaveLength(2);
    expect(invoice.payments.every((p) => p.id.startsWith("pay-"))).toBe(true);
  });

  test("settles to zero outstanding once the full amount lands", async () => {
    mechanicStubs.bookingById = makeBookingRow({
      booking_id: BOOKING_ID,
      customer_id: null,
      total: 450000,
      status: "completed",
      payment_status: "paid",
    });
    mechanicStubs.itemRows = [
      makeBookingItemRow({ booking_id: BOOKING_ID, line_total: 450000 }),
    ];
    paymentStubs.rows.set(`booking|${BOOKING_ID}`, [
      { payment_id: "pay-1", amount: 450000, status: "paid" },
    ]);

    const result = await readGuestInvoice(EMAIL, "booking", BOOKING_ID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.totals.extraFee).toBe(0);
    expect(result.data.totals.outstanding).toBe(0);
  });

  test("404 when the index lists a booking whose row has since vanished", async () => {
    mechanicStubs.bookingById = null;
    const result = await readGuestInvoice(EMAIL, "booking", BOOKING_ID);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(404);
  });
});

describe("readGuestInvoice rescue", () => {
  test("uses the estimate as the line and the final price as the total", async () => {
    guestAccessStubs.refs = [
      {
        record_type: "rescue",
        record_id: RESCUE_ID,
        created_at: new Date(),
        phone: null,
      },
    ];
    rescueStubs.rowById = makeRescueRow({
      request_id: RESCUE_ID,
      customer_id: null,
      price_estimate: 350000,
      final_price: 400000,
    });

    const result = await readGuestInvoice(EMAIL, "rescue", RESCUE_ID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.kind).toBe("rescue");
    expect(result.data.lines).toHaveLength(1);
    expect(result.data.totals.subtotal).toBe(350000);
    expect(result.data.totals.extraFee).toBe(50000);
    expect(result.data.totals.total).toBe(400000);
  });

  test("falls back to the estimate when no final price was set", async () => {
    guestAccessStubs.refs = [
      {
        record_type: "rescue",
        record_id: RESCUE_ID,
        created_at: new Date(),
        phone: null,
      },
    ];
    rescueStubs.rowById = makeRescueRow({
      request_id: RESCUE_ID,
      customer_id: null,
      price_estimate: 350000,
      final_price: null,
    });

    const result = await readGuestInvoice(EMAIL, "rescue", RESCUE_ID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.totals.total).toBe(350000);
    expect(result.data.totals.extraFee).toBe(0);
  });
});

describe("readGuestInvoice order", () => {
  test("keeps shipping and discount as separate rows", async () => {
    guestAccessStubs.refs = [
      {
        record_type: "order",
        record_id: ORDER_ID,
        created_at: new Date(),
        phone: null,
      },
    ];
    orderStubs.orderById = makeOrderRow({
      order_id: ORDER_ID,
      customer_id: null,
      subtotal: 1000000,
      shipping_fee: 30000,
      discount: 100000,
      total: 930000,
    });

    const result = await readGuestInvoice(EMAIL, "order", ORDER_ID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.kind).toBe("order");
    expect(result.data.totals).toMatchObject({
      subtotal: 1000000,
      extraFee: 30000,
      discount: 100000,
      total: 930000,
      paid: 0,
      outstanding: 930000,
    });
  });
});
