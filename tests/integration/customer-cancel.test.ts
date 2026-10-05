import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { BookingConfigRow } from "@/lib/booking/booking-config.repository";
import { makeUserRow } from "../helpers/auth.fixtures";
import {
  BOOKING_ID,
  CUSTOMER_ID,
  MECHANIC_ID,
  makeBookingRow,
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
  bookingConfigRepoMocks,
  bookingTravelRepoMocks,
  customerBookingsRepoMocks,
  domainPublishMocks,
  resetWorkspaceMocks,
  reviewRepoMocks,
  vehicleRepoMocks,
  workspaceStubs,
} from "../helpers/workspace.mocks";

// Customer self-cancel: ownership, status, note and the admin-tuned
// cutoff window, all before the CAS transition. Same mock harness as
// customer-workspace.test.ts, split out under the 350-line cap.
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
mock.module(
  "@/lib/booking/booking-config.repository",
  () => bookingConfigRepoMocks,
);

import { cancelCustomerBooking } from "@/lib/booking/customer-booking.service";

const OTHER_ID = "99999999-9999-4999-8999-999999999999";

function configRow(overrides?: Partial<BookingConfigRow>): BookingConfigRow {
  return {
    config_id: "default",
    min_lead_days: 2,
    max_advance_days: 0,
    cancel_cutoff_hours: 0,
    guest_booking_enabled: null,
    updated_at: new Date("2026-09-15T08:30:00.000Z"),
    updated_by: null,
    ...overrides,
  };
}

beforeEach(() => {
  resetMechanicMocks();
  resetWorkspaceMocks();
  serviceStubs.userById = makeUserRow({ role: "mechanic", status: "active" });
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

  test("rejects self-cancel inside the tuned cutoff window", async () => {
    workspaceStubs.bookingConfigRow = configRow({ cancel_cutoff_hours: 2 });
    mechanicStubs.bookingById = makeBookingRow({
      mechanic_id: null,
      scheduled_at: new Date(Date.now() + 30 * 60 * 1000),
    });

    const result = await cancelCustomerBooking(
      CUSTOMER_ID,
      BOOKING_ID,
      "doi lich",
    );

    expect(result).toMatchObject({ ok: false, status: 400 });
    if (result.ok) return;
    expect(result.errors.form).toContain("2 giờ");
    expect(
      bookingWorkflowRepoMocks.claimBookingTransition.mock.calls.length,
    ).toBe(0);
    expect(domainPublishMocks.publishBookingChange.mock.calls.length).toBe(0);
  });

  test("cancels outside the cutoff, at a zero cutoff, and without a slot", async () => {
    // Beyond the window: slot is 3 hours out with a 2-hour cutoff.
    workspaceStubs.bookingConfigRow = configRow({ cancel_cutoff_hours: 2 });
    mechanicStubs.bookingById = makeBookingRow({
      mechanic_id: null,
      scheduled_at: new Date(Date.now() + 3 * 60 * 60 * 1000),
    });
    expect(
      await cancelCustomerBooking(CUSTOMER_ID, BOOKING_ID, "doi"),
    ).toMatchObject({ ok: true });

    // Cutoff disabled: an imminent slot still cancels.
    workspaceStubs.bookingConfigRow = configRow({ cancel_cutoff_hours: 0 });
    mechanicStubs.bookingById = makeBookingRow({
      mechanic_id: null,
      scheduled_at: new Date(Date.now() + 5 * 60 * 1000),
    });
    expect(
      await cancelCustomerBooking(CUSTOMER_ID, BOOKING_ID, "doi"),
    ).toMatchObject({ ok: true });

    // No scheduled instant on the row: the cutoff can't be measured, but
    // the workflow layer still rejects the malformed booking downstream.
    workspaceStubs.bookingConfigRow = configRow({ cancel_cutoff_hours: 2 });
    mechanicStubs.bookingById = makeBookingRow({
      mechanic_id: null,
      scheduled_at: null,
    });
    expect(
      await cancelCustomerBooking(CUSTOMER_ID, BOOKING_ID, "doi"),
    ).toMatchObject({ ok: false, status: 400 });
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
