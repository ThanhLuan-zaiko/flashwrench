import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  guestRecordsRepoMocks,
  guestRecordsStubs,
  resetGuestRecordsMocks,
} from "../helpers/guest-records.mocks";
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

// Helpers first, mocks second, system under test last. The browser index and
// every domain row reader reuse the shared stubs: no ScyllaDB anywhere.
mock.module(
  "@/lib/guest-records/guest-records.repository",
  () => guestRecordsRepoMocks,
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

import { GUEST_COOKIE_TTL_SECONDS } from "@/lib/auth/guest-session.constants";
import type { GuestRecordType } from "@/lib/guest-access/guest-access.types";
import {
  GUEST_RECENT_LIMIT,
  listRecentGuestRecords,
  rememberGuestRecord,
} from "@/lib/guest-records/guest-records.service";

const GUEST_ID = "99999999-9999-4999-8999-999999999999";
const BOOKING_ID = "11111111-1111-4111-8111-111111111111";
const RESCUE_ID = "22222222-2222-4222-8222-222222222222";
const ORDER_ID = "33333333-3333-4333-8333-333333333333";
const CUSTOMER_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

function ref(recordType: GuestRecordType, recordId: string) {
  return {
    record_type: recordType,
    record_id: recordId,
    created_at: new Date("2026-10-28T08:00:00.000Z"),
  };
}

beforeEach(() => {
  resetGuestRecordsMocks();
  resetMechanicMocks();
  resetRescueMocks();
  resetPartsMocks();
});

describe("rememberGuestRecord", () => {
  test("writes one row with the cookie lifetime as TTL", async () => {
    const now = new Date("2026-10-28T08:00:00.000Z");
    const ok = await rememberGuestRecord(GUEST_ID, "booking", BOOKING_ID, now);
    expect(ok).toBe(true);
    expect(guestRecordsStubs.writes).toEqual([
      {
        guestId: GUEST_ID,
        recordType: "booking",
        recordId: BOOKING_ID,
        createdAt: now,
        ttlSeconds: GUEST_COOKIE_TTL_SECONDS,
      },
    ]);
  });

  test("rejects malformed ids without touching storage", async () => {
    expect(await rememberGuestRecord("nope", "booking", BOOKING_ID)).toBe(
      false,
    );
    expect(await rememberGuestRecord(GUEST_ID, "order", "nope")).toBe(false);
    expect(
      await rememberGuestRecord(
        GUEST_ID,
        "invoice" as GuestRecordType,
        BOOKING_ID,
      ),
    ).toBe(false);
    expect(guestRecordsRepoMocks.putGuestRecordRefByGid).not.toHaveBeenCalled();
  });

  // The job already persisted when this runs: an index outage must surface
  // as `false`, never as an exception that turns a 201 into a 500.
  test("reports a storage failure instead of throwing", async () => {
    guestRecordsStubs.putError = new Error("NoHostAvailable");
    const ok = await rememberGuestRecord(GUEST_ID, "rescue", RESCUE_ID);
    expect(ok).toBe(false);
  });
});

describe("listRecentGuestRecords", () => {
  test("no token, or a malformed one, has no history and reads nothing", async () => {
    expect(await listRecentGuestRecords(null)).toEqual([]);
    expect(await listRecentGuestRecords("not-a-uuid")).toEqual([]);
    expect(
      guestRecordsRepoMocks.listGuestRecordRefsByGid,
    ).not.toHaveBeenCalled();
  });

  test("reads one bounded partition for the token", async () => {
    await listRecentGuestRecords(GUEST_ID);
    expect(guestRecordsRepoMocks.listGuestRecordRefsByGid).toHaveBeenCalledWith(
      GUEST_ID,
      GUEST_RECENT_LIMIT,
    );
  });

  test("hydrates a booking with its tracking link", async () => {
    guestRecordsStubs.refs = [ref("booking", BOOKING_ID)];
    mechanicStubs.bookingById = makeBookingRow({
      booking_id: BOOKING_ID,
      customer_id: null,
    });
    mechanicStubs.itemRows = [
      makeBookingItemRow({ booking_id: BOOKING_ID, service_name: "Thay dầu" }),
    ];

    const records = await listRecentGuestRecords(GUEST_ID);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      type: "booking",
      id: BOOKING_ID,
      title: "Thay dầu",
      trackHref: `/track/booking/${BOOKING_ID}`,
    });
  });

  // Registering or logging in claims the job into an account; the browser
  // index row outlives the claim, so the read must filter it out.
  test("skips records that were claimed into an account", async () => {
    guestRecordsStubs.refs = [ref("booking", BOOKING_ID)];
    mechanicStubs.bookingById = makeBookingRow({
      booking_id: BOOKING_ID,
      customer_id: CUSTOMER_ID,
    });
    expect(await listRecentGuestRecords(GUEST_ID)).toEqual([]);
  });

  test("dedupes a job indexed twice", async () => {
    guestRecordsStubs.refs = [
      ref("order", ORDER_ID),
      ref("order", ORDER_ID),
    ];
    orderStubs.orderById = makeOrderRow({
      order_id: ORDER_ID,
      customer_id: null,
    });
    const records = await listRecentGuestRecords(GUEST_ID);
    expect(records).toHaveLength(1);
    expect(orderRepoMocks.findOrderRowById).toHaveBeenCalledTimes(1);
  });

  test("merges every kind of job, newest filed first", async () => {
    guestRecordsStubs.refs = [ref("rescue", RESCUE_ID), ref("order", ORDER_ID)];
    rescueStubs.rowById = makeRescueRow({
      request_id: RESCUE_ID,
      customer_id: null,
      created_at: new Date("2026-10-28T09:00:00.000Z"),
    });
    orderStubs.orderById = makeOrderRow({
      order_id: ORDER_ID,
      customer_id: null,
      created_at: new Date("2026-10-28T10:00:00.000Z"),
    });

    const records = await listRecentGuestRecords(GUEST_ID);
    expect(records.map((row) => row.type)).toEqual(["order", "rescue"]);
    // No public rescue tracking page yet: the menu falls back to /lookup.
    expect(records[1]?.trackHref).toBeNull();
  });
});
