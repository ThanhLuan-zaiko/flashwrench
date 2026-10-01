import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makeUserRow } from "../helpers/auth.fixtures";
import { makeBookingInput } from "../helpers/booking.fixtures";
import { makeCategoryRow, makeServiceRow } from "../helpers/catalog.fixtures";
import {
  MECHANIC_ID,
  makeAvailableMechanicRow,
  makeBookingRow,
  makeProfileRow,
} from "../helpers/mechanic.fixtures";
import { bookingWorkflowRepoMocks } from "../helpers/mechanic.mocks";
import {
  bookingRepoMocks,
  bookingStubs,
  catalogServiceRepoMocks,
  catalogStubs,
  categoryRepoMocks,
  mechanicBookingsRepoMocks,
  mechanicDirectoryRepoMocks,
  mechanicDirectoryStubs,
  mechanicStubs,
  mechanicWorkspaceRepoMocks,
  resetServiceMocks,
  serviceStubs,
  userRepoMocks,
} from "../helpers/service-mocks";
import {
  dispatchRepoMocks,
  domainPublishMocks,
  resetWorkspaceMocks,
  vehicleRepoMocks,
} from "../helpers/workspace.mocks";

// Guest booking suite: same mock harness as booking.service.test.ts,
// split out because that file hit the 350-line limit. createCustomerBooking
// with a null customer is the guest intake path behind POST /api/bookings.
mock.module("@/lib/booking/booking.repository", () => bookingRepoMocks);
mock.module("@/lib/catalog/services.repository", () => catalogServiceRepoMocks);
mock.module(
  "@/lib/catalog/service-categories.repository",
  () => categoryRepoMocks,
);
mock.module(
  "@/lib/mechanic/mechanic-workspace.repository",
  () => mechanicWorkspaceRepoMocks,
);
mock.module(
  "@/lib/mechanic/mechanic-bookings.repository",
  () => mechanicBookingsRepoMocks,
);
mock.module("@/lib/auth/user.repository", () => userRepoMocks);
mock.module("@/lib/vehicles/vehicle.repository", () => vehicleRepoMocks);
mock.module(
  "@/lib/mechanic/mechanic-directory.repository",
  () => mechanicDirectoryRepoMocks,
);
mock.module(
  "@/lib/booking/booking-workflow.repository",
  () => bookingWorkflowRepoMocks,
);
mock.module("@/lib/dispatch/dispatch.repository", () => dispatchRepoMocks);
mock.module("@/lib/realtime/domain-publish", () => domainPublishMocks);

import { createCustomerBooking } from "@/lib/booking/booking.service";

const GUEST_CONTACT = {
  fullName: "Tran Thi Be",
  phone: "0909999888",
  email: "Be@Example.com",
};

beforeEach(() => {
  resetServiceMocks();
  resetWorkspaceMocks();
  catalogStubs.serviceById = makeServiceRow();
  catalogStubs.categoryById = makeCategoryRow();
  serviceStubs.userById = makeUserRow({ role: "mechanic", status: "active" });
});

describe("guest bookings (customer = null)", () => {
  test("requires the contact trio before touching storage", async () => {
    const result = await createCustomerBooking(null, makeBookingInput());

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(result.errors.fullName).toBeTruthy();
    expect(result.errors.phone).toBeTruthy();
    expect(result.errors.email).toBeTruthy();
    expect(bookingStubs.inserts).toHaveLength(0);
    expect(catalogServiceRepoMocks.findServiceRowById.mock.calls.length).toBe(
      0,
    );
  });

  test("stores the guest contact snapshot with customer_id null", async () => {
    const result = await createCustomerBooking(
      null,
      makeBookingInput(GUEST_CONTACT),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(bookingStubs.inserts).toHaveLength(1);
    expect(bookingStubs.inserts[0]).toMatchObject({
      customerId: null,
      customerName: "Tran Thi Be",
      customerPhone: "0909999888",
      customerEmail: "be@example.com",
      status: "pending",
    });
  });

  test("ignores vehicleId for guests without an ownership read", async () => {
    const result = await createCustomerBooking(
      null,
      makeBookingInput({
        ...GUEST_CONTACT,
        vehicleId: "dddddddd-2222-4222-8222-dddddddddddd",
      }),
    );

    expect(result.ok).toBe(true);
    // Saved vehicles are account-owned: a guest-supplied id must never be
    // looked up or copied onto the booking.
    expect(vehicleRepoMocks.findVehicleRowById).not.toHaveBeenCalled();
    expect(bookingStubs.inserts[0]?.vehicleId).toBeNull();
    expect(bookingStubs.inserts[0]?.vehiclePlate).toBe("51F-12345");
  });

  test("still auto-dispatches guests to the nearest mechanic", async () => {
    mechanicStubs.bookingById = makeBookingRow({
      mechanic_id: null,
      mechanic_name: null,
      status: "pending",
      scheduled_at: new Date(Date.now() + 25 * 60 * 60 * 1000),
    });
    mechanicStubs.profile = makeProfileRow();
    mechanicDirectoryStubs.rows = [makeAvailableMechanicRow()];

    const result = await createCustomerBooking(
      null,
      makeBookingInput({ ...GUEST_CONTACT, lat: 10.7723, lng: 106.698 }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.mechanicId).toBe(MECHANIC_ID);
    expect(domainPublishMocks.publishBookingChange.mock.calls[0]?.[0]).toBe(
      "booking-assigned",
    );
  });
});
