import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  BOOKING_ID,
  CUSTOMER_ID,
  makeBookingRow,
} from "../helpers/mechanic.fixtures";
import {
  mechanicBookingsRepoMocks,
  mechanicStubs,
  resetMechanicMocks,
} from "../helpers/mechanic.mocks";
import {
  bookingTravelRepoMocks,
  resetWorkspaceMocks,
  workspaceStubs,
} from "../helpers/workspace.mocks";

mock.module(
  "@/lib/mechanic/mechanic-bookings.repository",
  () => mechanicBookingsRepoMocks,
);
mock.module(
  "@/lib/booking/booking-travel.repository",
  () => bookingTravelRepoMocks,
);

import { getCustomerBookingTrack } from "@/lib/booking/customer-booking.service";

beforeEach(() => {
  resetMechanicMocks();
  resetWorkspaceMocks();
});

describe("getCustomerBookingTrack", () => {
  test("returns validated travel points for an owned booking", async () => {
    mechanicStubs.bookingById = makeBookingRow();
    workspaceStubs.bookingTravelPoints = [
      {
        recorded_at: new Date("2026-09-16T07:00:00.000Z"),
        lat: 10.77,
        lng: 106.7,
      },
      { recorded_at: null, lat: 91, lng: 106.7 },
    ];

    const result = await getCustomerBookingTrack(CUSTOMER_ID, BOOKING_ID);

    expect(result).toEqual({
      ok: true,
      data: [
        {
          lat: 10.77,
          lng: 106.7,
          recordedAt: "2026-09-16T07:00:00.000Z",
        },
      ],
    });
    expect(bookingTravelRepoMocks.listBookingTravelPoints).toHaveBeenCalledWith(
      BOOKING_ID,
    );
  });

  test("hides another customer's route without reading route points", async () => {
    mechanicStubs.bookingById = makeBookingRow({
      customer_id: "99999999-9999-4999-8999-999999999999",
    });

    const result = await getCustomerBookingTrack(CUSTOMER_ID, BOOKING_ID);

    expect(result).toMatchObject({ ok: false, status: 404 });
    expect(bookingTravelRepoMocks.listBookingTravelPoints).not.toHaveBeenCalled();
  });

  test("rejects malformed booking ids before storage access", async () => {
    const result = await getCustomerBookingTrack(CUSTOMER_ID, "not-a-uuid");

    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(mechanicBookingsRepoMocks.findBookingRowById).not.toHaveBeenCalled();
    expect(bookingTravelRepoMocks.listBookingTravelPoints).not.toHaveBeenCalled();
  });
});
