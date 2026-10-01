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

// Helpers first, mocks second, system under test last. The email index and
// every domain row reader reuse the shared stubs: no ScyllaDB anywhere.
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

import {
  listGuestRecords,
  requireGuestRecord,
} from "@/lib/guest-access/guest-access.service";

const EMAIL = "an@example.com";
const BOOKING_ID = "11111111-1111-1111-1111-111111111111";
const RESCUE_ID = "22222222-2222-4222-8222-222222222222";
const ORDER_ID = "33333333-3333-4333-8333-333333333333";

type IndexRef = {
  record_type: "booking" | "rescue" | "order";
  record_id: string;
  created_at: Date;
  phone: string | null;
};

function ref(recordType: IndexRef["record_type"], recordId: string): IndexRef {
  return {
    record_type: recordType,
    record_id: recordId,
    created_at: new Date("2026-09-15T08:30:00.000Z"),
    phone: "0912345678",
  };
}

beforeEach(() => {
  resetGuestAccessMocks();
  resetMechanicMocks();
  resetRescueMocks();
  resetPartsMocks();
});

describe("requireGuestRecord", () => {
  test("401 without a verified address, without touching storage", async () => {
    const result = await requireGuestRecord("", "booking", BOOKING_ID);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(401);
    expect(
      guestAccessRepoMocks.listGuestRecordRefsByEmail,
    ).not.toHaveBeenCalled();
  });

  test("400 for a malformed id", async () => {
    const result = await requireGuestRecord(EMAIL, "booking", "not-a-uuid");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
  });

  test("allows a record the index lists for that address", async () => {
    guestAccessStubs.refs = [ref("booking", BOOKING_ID)];
    const result = await requireGuestRecord(EMAIL, "booking", BOOKING_ID);
    expect(result.ok).toBe(true);
  });

  // The whole point of the gate: a real id belonging to someone else must be
  // indistinguishable from one that does not exist.
  test("404 for a record the index does not list", async () => {
    guestAccessStubs.refs = [ref("booking", BOOKING_ID)];
    const other = "99999999-9999-4999-8999-999999999999";
    const result = await requireGuestRecord(EMAIL, "booking", other);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(404);
  });

  test("404 when the index lists the id under a different type", async () => {
    guestAccessStubs.refs = [ref("booking", BOOKING_ID)];
    const result = await requireGuestRecord(EMAIL, "order", BOOKING_ID);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(404);
  });
});

describe("listGuestRecords", () => {
  test("401 without a verified address", async () => {
    const result = await listGuestRecords("");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(401);
  });

  test("returns an empty list for an address with no history", async () => {
    const result = await listGuestRecords(EMAIL);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.records).toEqual([]);
    // The response never carries the full address.
    expect(result.data.maskedEmail).not.toBe(EMAIL);
  });

  test("hydrates an index row into a summary with a tracking link", async () => {
    guestAccessStubs.refs = [ref("booking", BOOKING_ID)];
    mechanicStubs.bookingById = makeBookingRow({
      booking_id: BOOKING_ID,
      customer_id: null,
    });
    mechanicStubs.itemRows = [
      makeBookingItemRow({
        booking_id: BOOKING_ID,
        service_name: "Thay dau doi co",
      }),
    ];

    const result = await listGuestRecords(EMAIL);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.records).toHaveLength(1);
    const record = result.data.records[0];
    expect(record.type).toBe("booking");
    expect(record.id).toBe(BOOKING_ID);
    expect(record.title).toBe("Thay dau doi co");
    // The public tracking route works from the id alone, so the OTP flow
    // hands the visitor straight to the live map.
    expect(record.trackHref).toBe(`/track/booking/${BOOKING_ID}`);
  });

  // A claim into an account deletes the phone-keyed ref, but the email index
  // row survives. Without this filter the lookup would keep serving a record
  // that now belongs to a signed-in customer.
  test("skips a record that was claimed into an account", async () => {
    guestAccessStubs.refs = [ref("booking", BOOKING_ID)];
    mechanicStubs.bookingById = makeBookingRow({
      booking_id: BOOKING_ID,
      customer_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    });

    const result = await listGuestRecords(EMAIL);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.records).toEqual([]);
  });

  test("lists rescues and orders alongside bookings", async () => {
    guestAccessStubs.refs = [ref("rescue", RESCUE_ID), ref("order", ORDER_ID)];
    rescueStubs.rowById = makeRescueRow({
      request_id: RESCUE_ID,
      customer_id: null,
    });
    orderStubs.orderById = makeOrderRow({
      order_id: ORDER_ID,
      customer_id: null,
    });

    const result = await listGuestRecords(EMAIL);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const types = result.data.records.map((r) => r.type);
    expect(types).toContain("rescue");
    expect(types).toContain("order");
    // No public rescue tracking page exists yet, so no link is offered.
    const rescue = result.data.records.find((r) => r.type === "rescue");
    expect(rescue?.trackHref).toBeNull();
    const order = result.data.records.find((r) => r.type === "order");
    expect(order?.trackHref).toBe(`/track/order/${ORDER_ID}`);
  });
});
