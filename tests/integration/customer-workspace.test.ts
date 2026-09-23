import { beforeEach, describe, expect, mock, test } from "bun:test";
import { decodeCursor, encodeCursor } from "@/lib/db/cursor";
import { makeUserRow } from "../helpers/auth.fixtures";
import {
  BOOKING_ID,
  CUSTOMER_ID,
  MECHANIC_ID,
  makeBookingRow,
  makeLocationRow,
  makeProfileRow,
} from "../helpers/mechanic.fixtures";
import {
  bookingWorkflowRepoMocks,
  mechanicBookingsRepoMocks,
  mechanicDirectoryRepoMocks,
  mechanicStubs,
  mechanicWorkspaceRepoMocks,
  resetMechanicMocks,
} from "../helpers/mechanic.mocks";
import { serviceStubs, userRepoMocks } from "../helpers/service-mocks";
import {
  bookingTravelRepoMocks,
  customerBookingsRepoMocks,
  domainPublishMocks,
  resetWorkspaceMocks,
  reviewRepoMocks,
  vehicleRepoMocks,
  workspaceStubs,
} from "../helpers/workspace.mocks";

mock.module(
  "@/lib/booking/customer-bookings.repository",
  () => customerBookingsRepoMocks,
);
mock.module(
  "@/lib/booking/booking-travel.repository",
  () => bookingTravelRepoMocks,
);
mock.module(
  "@/lib/mechanic/mechanic-bookings.repository",
  () => mechanicBookingsRepoMocks,
);
mock.module(
  "@/lib/mechanic/mechanic-workspace.repository",
  () => mechanicWorkspaceRepoMocks,
);
mock.module(
  "@/lib/booking/booking-workflow.repository",
  () => bookingWorkflowRepoMocks,
);
mock.module("@/lib/booking/review.repository", () => reviewRepoMocks);
mock.module("@/lib/auth/user.repository", () => userRepoMocks);
mock.module(
  "@/lib/mechanic/mechanic-directory.repository",
  () => mechanicDirectoryRepoMocks,
);
mock.module("@/lib/vehicles/vehicle.repository", () => vehicleRepoMocks);
mock.module("@/lib/realtime/domain-publish", () => domainPublishMocks);

import {
  cancelCustomerBooking,
  getCustomerBooking,
  listCustomerBookings,
} from "@/lib/booking/customer-booking.service";

const OTHER_ID = "99999999-9999-4999-8999-999999999999";

function refRow(bookingId: string) {
  return {
    scheduled_at: new Date("2026-09-16T07:00:00.000Z"),
    booking_id: bookingId,
    status: "pending",
    total: 450000,
    vehicle_plate: "51A-12345",
    mechanic_name: "Nguyen Van A",
  };
}

beforeEach(() => {
  resetMechanicMocks();
  resetWorkspaceMocks();
  serviceStubs.userById = makeUserRow({ role: "mechanic", status: "active" });
});

describe("listCustomerBookings", () => {
  test("returns only rows canonically owned by the customer", async () => {
    workspaceStubs.customerBookingPage = {
      rows: [refRow(BOOKING_ID), refRow(OTHER_ID)],
      pageState: "next-page",
    };
    mechanicStubs.bookingRowsByIds = [
      makeBookingRow(),
      makeBookingRow({ booking_id: OTHER_ID, customer_id: OTHER_ID }),
    ];
    mechanicStubs.itemRows = [];

    const result = await listCustomerBookings(CUSTOMER_ID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items).toHaveLength(1);
    expect(result.data.items[0]?.id).toBe(BOOKING_ID);
    expect(result.data.items[0]?.customerId).toBe(CUSTOMER_ID);
    expect(result.data.nextCursor).not.toBeNull();
    const scope = `customer-bookings:${CUSTOMER_ID}`;
    expect(decodeCursor(result.data.nextCursor, scope)).toBe("next-page");
  });

  test("continues scanning older cursor pages until search results are filled", async () => {
    workspaceStubs.customerBookingPages = [
      {
        rows: [refRow(OTHER_ID)],
        pageState: "older-page",
      },
      {
        rows: [refRow(BOOKING_ID)],
        pageState: null,
      },
    ];
    mechanicStubs.bookingRowsByIdsQueue = [
      [
        makeBookingRow({
          booking_id: OTHER_ID,
          address: { full_text: "999 Other Road", lat: 10.77, lng: 106.7 },
        }),
      ],
      [
        makeBookingRow({
          address: { full_text: "123 Le Loi, Quan 1", lat: 10.77, lng: 106.7 },
        }),
      ],
    ];

    const result = await listCustomerBookings(CUSTOMER_ID, {
      limit: 1,
      search: "lê lợi",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items.map((item) => item.id)).toEqual([BOOKING_ID]);
    expect(customerBookingsRepoMocks.listCustomerBookingRefs.mock.calls).toHaveLength(2);
  });

  test("rejects overlong search terms before reading storage", async () => {
    const result = await listCustomerBookings(CUSTOMER_ID, {
      search: "x".repeat(81),
    });
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(customerBookingsRepoMocks.listCustomerBookingRefs.mock.calls).toHaveLength(0);
  });

  test("rejects invalid, malformed and wrong-scope cursors", async () => {
    expect(
      await listCustomerBookings(CUSTOMER_ID, { cursor: "forged" }),
    ).toMatchObject({ ok: false, status: 400 });
    const foreign = encodeCursor("state", `customer-bookings:${OTHER_ID}`);
    expect(
      await listCustomerBookings(CUSTOMER_ID, { cursor: foreign }),
    ).toMatchObject({ ok: false, status: 400 });
    const invalidLimit = await listCustomerBookings(CUSTOMER_ID, {
      limit: "abc",
    });
    expect(invalidLimit).toMatchObject({ ok: false, status: 400 });
    expect(
      customerBookingsRepoMocks.listCustomerBookingRefs.mock.calls.length,
    ).toBe(0);
  });

  test("skips refs whose canonical row is missing or bad status", async () => {
    workspaceStubs.customerBookingPage = {
      rows: [refRow(BOOKING_ID), refRow(OTHER_ID)],
      pageState: null,
    };
    mechanicStubs.bookingRowsByIds = [makeBookingRow({ status: "shipped" })];
    mechanicStubs.itemRows = [];

    const result = await listCustomerBookings(CUSTOMER_ID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items).toHaveLength(0);
    expect(result.data.nextCursor).toBeNull();
  });
});

describe("getCustomerBooking", () => {
  test("rejects foreign bookings without touching detail reads", async () => {
    mechanicStubs.bookingById = makeBookingRow({ customer_id: OTHER_ID });

    const result = await getCustomerBooking(CUSTOMER_ID, BOOKING_ID);
    expect(result).toMatchObject({ ok: false, status: 404 });
    expect(
      mechanicBookingsRepoMocks.listBookingItemRowsByBookingIds.mock.calls
        .length,
    ).toBe(0);
    expect(
      mechanicBookingsRepoMocks.listStatusHistoryRows.mock.calls.length,
    ).toBe(0);
    expect(
      mechanicWorkspaceRepoMocks.findMechanicLocationRow.mock.calls.length,
    ).toBe(0);
  });

  test("rejects non-UUID ids before any storage read", async () => {
    const result = await getCustomerBooking(CUSTOMER_ID, "not-a-uuid");
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(mechanicBookingsRepoMocks.findBookingRowById.mock.calls.length).toBe(
      0,
    );
  });

  test("gates live location by status, job ownership and freshness", async () => {
    mechanicStubs.bookingById = makeBookingRow({ status: "en_route" });
    mechanicStubs.location = makeLocationRow({
      current_job_id: BOOKING_ID,
      current_job_type: "booking",
      updated_at: new Date(),
    });
    const fresh = await getCustomerBooking(CUSTOMER_ID, BOOKING_ID);
    expect(fresh.ok).toBe(true);
    if (!fresh.ok) return;
    expect(fresh.data.location).not.toBeNull();

    mechanicStubs.location = makeLocationRow({
      current_job_id: BOOKING_ID,
      current_job_type: "booking",
      updated_at: new Date(Date.now() - 10 * 60 * 1000),
    });
    const stale = await getCustomerBooking(CUSTOMER_ID, BOOKING_ID);
    expect(stale.ok && stale.data.location).toBeNull();

    mechanicStubs.location = makeLocationRow({
      current_job_id: BOOKING_ID,
      current_job_type: "booking",
      updated_at: new Date(Date.now() + 60 * 1000),
    });
    const future = await getCustomerBooking(CUSTOMER_ID, BOOKING_ID);
    expect(future.ok && future.data.location).toBeNull();

    mechanicStubs.location = makeLocationRow({
      current_job_id: OTHER_ID,
      current_job_type: "booking",
    });
    const wrongJob = await getCustomerBooking(CUSTOMER_ID, BOOKING_ID);
    expect(wrongJob.ok && wrongJob.data.location).toBeNull();

    mechanicStubs.bookingById = makeBookingRow({ status: "pending" });
    const inactive = await getCustomerBooking(CUSTOMER_ID, BOOKING_ID);
    expect(inactive.ok && inactive.data.location).toBeNull();
  });
});

describe("cancelCustomerBooking", () => {
  test("rejects unknown, foreign, terminal and in-progress bookings", async () => {
    mechanicStubs.bookingById = null;
    expect(
      await cancelCustomerBooking(CUSTOMER_ID, BOOKING_ID, "doi lich"),
    ).toMatchObject({ ok: false, status: 404 });

    mechanicStubs.bookingById = makeBookingRow({ customer_id: OTHER_ID });
    expect(
      await cancelCustomerBooking(CUSTOMER_ID, BOOKING_ID, "doi lich"),
    ).toMatchObject({ ok: false, status: 404 });

    for (const status of ["completed", "cancelled", "no_show", "in_progress"]) {
      mechanicStubs.bookingById = makeBookingRow({
        status: status as never,
      });
      expect(
        await cancelCustomerBooking(CUSTOMER_ID, BOOKING_ID, "doi lich"),
      ).toMatchObject({ ok: false, status: 400 });
    }
    expect(
      bookingWorkflowRepoMocks.claimBookingTransition.mock.calls.length,
    ).toBe(0);
  });

  test("rejects an empty or overlong note before any write", async () => {
    mechanicStubs.bookingById = makeBookingRow();
    expect(
      await cancelCustomerBooking(CUSTOMER_ID, BOOKING_ID, "   "),
    ).toMatchObject({ ok: false, status: 400 });
    expect(
      await cancelCustomerBooking(CUSTOMER_ID, BOOKING_ID, "x".repeat(301)),
    ).toMatchObject({ ok: false, status: 400 });
    expect(
      await cancelCustomerBooking(CUSTOMER_ID, BOOKING_ID, undefined),
    ).toMatchObject({ ok: false, status: 400 });
    expect(
      bookingWorkflowRepoMocks.claimBookingTransition.mock.calls.length,
    ).toBe(0);
  });

  test("failed CAS returns 409 and skips projections and side effects", async () => {
    mechanicStubs.bookingById = makeBookingRow();
    mechanicStubs.transitionClaimed = false;
    const result = await cancelCustomerBooking(CUSTOMER_ID, BOOKING_ID, "doi");
    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(
      bookingWorkflowRepoMocks.projectBookingTransition.mock.calls.length,
    ).toBe(0);
    expect(
      mechanicWorkspaceRepoMocks.setMechanicAvailability.mock.calls.length,
    ).toBe(0);
    expect(domainPublishMocks.publishBookingChange.mock.calls.length).toBe(0);
  });

  test("successful cancel projects and releases the assigned mechanic", async () => {
    mechanicStubs.bookingById = makeBookingRow();
    mechanicStubs.activeJob = BOOKING_ID;
    mechanicStubs.profile = makeProfileRow();

    const result = await cancelCustomerBooking(
      CUSTOMER_ID,
      BOOKING_ID,
      "  Doi lich hen  ",
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.status).toBe("cancelled");
    const claim = bookingWorkflowRepoMocks.claimBookingTransition.mock
      .calls[0]?.[0] as {
      mechanicId: string | null;
      mechanicName: string | null;
    };
    expect(claim.mechanicId).toBe(MECHANIC_ID);
    expect(claim.mechanicName).toBe("Nguyen Van A");
    expect(
      bookingWorkflowRepoMocks.projectBookingTransition.mock.calls.length,
    ).toBe(1);
    expect(mechanicStubs.activeJobReleased).toEqual([BOOKING_ID]);
    expect(
      mechanicWorkspaceRepoMocks.setMechanicAvailability.mock.calls[0]?.slice(
        0,
        2,
      ),
    ).toEqual([MECHANIC_ID, true]);
    expect(domainPublishMocks.publishBookingChange.mock.calls.length).toBe(1);
  });
});
