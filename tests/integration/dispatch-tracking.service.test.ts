import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makePublicUser } from "../helpers/auth.fixtures";
import { BOOKING_ID, makeBookingRow } from "../helpers/mechanic.fixtures";
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

import { getDispatchBookingTrack } from "@/lib/dispatch/dispatch-tracking.service";

const dispatcher = makePublicUser({ role: "dispatcher" });

beforeEach(() => {
  resetMechanicMocks();
  resetWorkspaceMocks();
});

describe("getDispatchBookingTrack", () => {
  test("returns valid GPS samples to dispatchers", async () => {
    mechanicStubs.bookingById = makeBookingRow();
    workspaceStubs.bookingTravelPoints = [
      {
        recorded_at: new Date("2026-09-16T07:00:00.000Z"),
        lat: 10.77,
        lng: 106.7,
      },
      { recorded_at: null, lat: 91, lng: 106.7 },
    ];

    const result = await getDispatchBookingTrack(dispatcher, BOOKING_ID);

    expect(result).toMatchObject({
      ok: true,
      data: [
        {
          lat: 10.77,
          lng: 106.7,
          recordedAt: "2026-09-16T07:00:00.000Z",
        },
      ],
    });
  });

  test("rejects other roles before reading the route", async () => {
    const result = await getDispatchBookingTrack(
      makePublicUser({ role: "customer" }),
      BOOKING_ID,
    );

    expect(result).toMatchObject({ ok: false, status: 403 });
    expect(mechanicBookingsRepoMocks.findBookingRowById).not.toHaveBeenCalled();
    expect(
      bookingTravelRepoMocks.listBookingTravelPoints,
    ).not.toHaveBeenCalled();
  });
});
