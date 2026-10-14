import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  BOOKING_ID,
  MECHANIC_ID,
  makeBookingRow,
} from "../helpers/mechanic.fixtures";
import {
  mechanicBookingsRepoMocks,
  mechanicStubs,
  mechanicWorkspaceRepoMocks,
  resetMechanicMocks,
} from "../helpers/mechanic.mocks";
import { makeOrderRow } from "../helpers/parts.fixtures";
import {
  orderDeliveryRepoMocks,
  orderRepoMocks,
  orderStubs,
  resetPartsMocks,
} from "../helpers/parts.mocks";
import {
  bookingTravelRepoMocks,
  domainPublishMocks,
  resetWorkspaceMocks,
} from "../helpers/workspace.mocks";

mock.module(
  "@/lib/mechanic/mechanic-bookings.repository",
  () => mechanicBookingsRepoMocks,
);
mock.module(
  "@/lib/mechanic/mechanic-workspace.repository",
  () => mechanicWorkspaceRepoMocks,
);
mock.module(
  "@/lib/booking/booking-travel.repository",
  () => bookingTravelRepoMocks,
);
mock.module("@/lib/orders/orders.repository", () => orderRepoMocks);
mock.module(
  "@/lib/orders/orders-delivery.repository",
  () => orderDeliveryRepoMocks,
);
mock.module("@/lib/realtime/domain-publish", () => domainPublishMocks);

import { saveMechanicLocation } from "@/lib/mechanic/mechanic-location.service";

const ORDER_ID = "ffffffff-ffff-4fff-8fff-ffffffffffff";

beforeEach(() => {
  resetMechanicMocks();
  resetWorkspaceMocks();
  resetPartsMocks();
});

describe("gps live fan-out", () => {
  test("en_route booking move publishes for instant maps", async () => {
    mechanicStubs.bookingById = makeBookingRow({ status: "en_route" });
    const result = await saveMechanicLocation(MECHANIC_ID, {
      latitude: 10.775,
      longitude: 106.701,
      currentJobId: BOOKING_ID,
      currentJobType: "booking",
    });
    expect(result.ok).toBe(true);
    expect(domainPublishMocks.publishBookingChange.mock.calls.length).toBe(1);
  });

  test("shipping order move publishes order topic", async () => {
    orderStubs.orderById = makeOrderRow({
      order_id: ORDER_ID,
      status: "shipping",
      courier_type: "mechanic",
      courier_id: MECHANIC_ID,
    });
    const result = await saveMechanicLocation(MECHANIC_ID, {
      latitude: 10.775,
      longitude: 106.701,
      currentJobId: ORDER_ID,
      currentJobType: "order",
    });
    expect(result.ok).toBe(true);
    expect(domainPublishMocks.publishOrderChange.mock.calls.length).toBe(1);
    expect(domainPublishMocks.publishOrderChange.mock.calls[0]?.[0]).toBe(
      ORDER_ID,
    );
  });
});
