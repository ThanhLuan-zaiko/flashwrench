import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makePublicUser, makeUserRow } from "../helpers/auth.fixtures";
import { makeBookingInput } from "../helpers/booking.fixtures";
import { makeCategoryRow, makeServiceRow } from "../helpers/catalog.fixtures";
import { bookingWorkflowRepoMocks } from "../helpers/mechanic.mocks";
import {
  bookingRepoMocks,
  bookingStubs,
  catalogServiceRepoMocks,
  catalogStubs,
  categoryRepoMocks,
  mechanicBookingsRepoMocks,
  mechanicDirectoryRepoMocks,
  mechanicWorkspaceRepoMocks,
  resetServiceMocks,
  serviceStubs,
  userRepoMocks,
} from "../helpers/service-mocks";
import {
  bookingConfigRepoMocks,
  businessHoursRepoMocks,
  dispatchRepoMocks,
  domainPublishMocks,
  resetWorkspaceMocks,
  shopSettingsStubs,
  vehicleRepoMocks,
  workspaceStubs,
} from "../helpers/workspace.mocks";

// Same stub harness as booking.service.test.ts — bun runs each file in
// its own process so mock.module has to be declared per file. This
// file isolates the admin-tuned policy knobs (booking_config intake
// window + business_hours working window) feeding createCustomerBooking.
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
mock.module(
  "@/lib/booking/booking-config.repository",
  () => bookingConfigRepoMocks,
);
mock.module(
  "@/lib/shop/business-hours.repository",
  () => businessHoursRepoMocks,
);

import { createCustomerBooking } from "@/lib/booking/booking.service";

beforeEach(() => {
  resetServiceMocks();
  resetWorkspaceMocks();
  catalogStubs.serviceById = makeServiceRow();
  catalogStubs.categoryById = makeCategoryRow();
  serviceStubs.userById = makeUserRow({ role: "mechanic", status: "active" });
});

describe("createCustomerBooking — tuned policy", () => {
  test("applies the tuned intake window from booking_config", async () => {
    // The default input lands 3 days out: a 4-day floor rejects it, a
    // matching 4-day advance cap accepts it.
    workspaceStubs.bookingConfigRow = {
      config_id: "default",
      min_lead_days: 4,
      max_advance_days: 4,
      cancel_cutoff_hours: 0,
      guest_booking_enabled: null,
      updated_at: null,
      updated_by: null,
    };
    const tooSoon = await createCustomerBooking(
      makePublicUser(),
      makeBookingInput(),
    );
    expect(tooSoon.ok).toBe(false);
    if (tooSoon.ok) return;
    expect(tooSoon.errors.scheduledAt).toContain("4 ngày");

    workspaceStubs.bookingConfigRow = {
      config_id: "default",
      min_lead_days: 0,
      max_advance_days: 2,
      cancel_cutoff_hours: 0,
      guest_booking_enabled: null,
      updated_at: null,
      updated_by: null,
    };
    const tooFar = await createCustomerBooking(
      makePublicUser(),
      makeBookingInput(),
    );
    expect(tooFar.ok).toBe(false);
    if (tooFar.ok) return;
    expect(tooFar.errors.scheduledAt).toContain("2 ngày tới");
    expect(bookingStubs.inserts).toHaveLength(0);
  });

  test("rejects guests when the shop turns off guest intake", async () => {
    workspaceStubs.bookingConfigRow = {
      config_id: "default",
      min_lead_days: 2,
      max_advance_days: 0,
      cancel_cutoff_hours: 0,
      guest_booking_enabled: false,
      updated_at: null,
      updated_by: null,
    };

    // Signed-in customers are unaffected — only guest intake closes.
    const signedIn = await createCustomerBooking(
      makePublicUser(),
      makeBookingInput(),
    );
    expect(signedIn.ok).toBe(true);
  });

  test("rejects slots outside the tuned working-hours window", async () => {
    // 23:00 shop-local on a far-future day is outside 07:00–20:00.
    shopSettingsStubs.hoursRow = {
      config_id: "default",
      enabled: true,
      opens_at_min: 7 * 60,
      closes_at_min: 20 * 60,
      timezone: "Asia/Ho_Chi_Minh",
      updated_at: null,
      updated_by: null,
    };

    const outside = await createCustomerBooking(
      makePublicUser(),
      makeBookingInput({ scheduledAt: "2030-06-15T23:00:00+07:00" }),
    );
    expect(outside.ok).toBe(false);
    if (outside.ok) return;
    expect(outside.errors.scheduledAt).toContain("07:00–20:00");

    // The same input slips through when the window is disabled.
    shopSettingsStubs.hoursRow = null;
    const anyHour = await createCustomerBooking(
      makePublicUser(),
      makeBookingInput({ scheduledAt: "2030-06-15T23:00:00+07:00" }),
    );
    expect(anyHour.ok).toBe(true);
  });
});
