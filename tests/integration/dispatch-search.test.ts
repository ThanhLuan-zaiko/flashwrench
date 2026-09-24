import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makePublicUser, makeUserRow } from "../helpers/auth.fixtures";
import {
  BOOKING_ID,
  MECHANIC_OTHER_ID,
  makeBookingRow,
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
  dispatchRepoMocks,
  domainPublishMocks,
  resetWorkspaceMocks,
  reviewRepoMocks,
  vehicleRepoMocks,
  workspaceStubs,
} from "../helpers/workspace.mocks";

mock.module("@/lib/dispatch/dispatch.repository", () => dispatchRepoMocks);
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
mock.module("@/lib/auth/user.repository", () => userRepoMocks);
mock.module(
  "@/lib/mechanic/mechanic-directory.repository",
  () => mechanicDirectoryRepoMocks,
);
mock.module("@/lib/vehicles/vehicle.repository", () => vehicleRepoMocks);
mock.module("@/lib/booking/review.repository", () => reviewRepoMocks);
mock.module("@/lib/realtime/domain-publish", () => domainPublishMocks);

import { listDispatchBookings } from "@/lib/dispatch/dispatch.service";

const dispatcher = makePublicUser({ role: "dispatcher" });

beforeEach(() => {
  resetMechanicMocks();
  resetWorkspaceMocks();
  serviceStubs.userById = makeUserRow({ role: "mechanic", status: "active" });
});

describe("dispatch booking search", () => {
  test("scans older cursor pages to fill a filtered page", async () => {
    workspaceStubs.dispatchRefPages = [
      {
        rows: [
          {
            scheduled_at: new Date("2026-09-16T07:00:00.000Z"),
            booking_id: MECHANIC_OTHER_ID,
          },
        ],
        pageState: "older-page",
      },
      {
        rows: [
          {
            scheduled_at: new Date("2026-09-16T08:00:00.000Z"),
            booking_id: BOOKING_ID,
          },
        ],
        pageState: null,
      },
    ];
    mechanicStubs.bookingRowsByIdsQueue = [
      [
        makeBookingRow({
          booking_id: MECHANIC_OTHER_ID,
          status: "en_route",
          month_bucket: "2026-09",
          address: { full_text: "999 Other Road", lat: 10.77, lng: 106.7 },
        }),
      ],
      [
        makeBookingRow({
          booking_id: BOOKING_ID,
          status: "en_route",
          month_bucket: "2026-09",
          address: { full_text: "123 Le Loi, Quan 1", lat: 10.77, lng: 106.7 },
        }),
      ],
    ];

    const result = await listDispatchBookings(dispatcher, {
      status: "en_route",
      month: "2026-09",
      limit: 1,
      search: "lê lợi",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items.map((booking) => booking.id)).toEqual([
      BOOKING_ID,
    ]);
    expect(dispatchRepoMocks.listStatusBookingRefs.mock.calls).toHaveLength(2);
  });

  test("rejects overlong searches without reading the partition", async () => {
    const result = await listDispatchBookings(dispatcher, {
      status: "en_route",
      month: "2026-09",
      search: "x".repeat(81),
    });

    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(dispatchRepoMocks.listStatusBookingRefs).not.toHaveBeenCalled();
  });
});
