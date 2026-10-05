import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makePublicUser, makeUserRow } from "../helpers/auth.fixtures";
import { makeBookingInput } from "../helpers/booking.fixtures";
import { makeCategoryRow, makeServiceRow } from "../helpers/catalog.fixtures";
import {
  MECHANIC_ID,
  makeBookingRow,
  makeProfileRow,
  makeWorkloadRow,
} from "../helpers/mechanic.fixtures";
import {
  bookingRepoMocks,
  bookingStubs,
  catalogServiceRepoMocks,
  catalogStubs,
  categoryRepoMocks,
  mechanicBookingsRepoMocks,
  mechanicDirectoryRepoMocks,
  mechanicStubs,
  mechanicWorkspaceRepoMocks,
  resetServiceMocks,
  serviceStubs,
  userRepoMocks,
  voucherCampaignRepoMocks,
  voucherRealtimeMocks,
  voucherStubs,
  voucherWalletRepoMocks,
} from "../helpers/service-mocks";
import {
  makeCampaignRow,
  makeWalletRow,
  VOUCHER_CUSTOMER_ID,
  VOUCHER_WALLET_ID,
} from "../helpers/voucher.fixtures";
import {
  bookingConfigRepoMocks,
  businessHoursRepoMocks,
  domainPublishMocks,
  vehicleRepoMocks,
} from "../helpers/workspace.mocks";

mock.module("@/lib/booking/booking.repository", () => bookingRepoMocks);
mock.module("@/lib/catalog/services.repository", () => catalogServiceRepoMocks);
mock.module(
  "@/lib/catalog/service-categories.repository",
  () => categoryRepoMocks,
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
  "@/lib/mechanic/mechanic-directory.repository",
  () => mechanicDirectoryRepoMocks,
);
mock.module("@/lib/auth/user.repository", () => userRepoMocks);
mock.module("@/lib/vehicles/vehicle.repository", () => vehicleRepoMocks);
mock.module(
  "@/lib/vouchers/voucher-campaign.repository",
  () => voucherCampaignRepoMocks,
);
mock.module(
  "@/lib/vouchers/voucher-wallet.repository",
  () => voucherWalletRepoMocks,
);
mock.module("@/lib/vouchers/voucher-realtime", () => voucherRealtimeMocks);
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

const FIRST_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const SECOND_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const OTHER_BOOKING_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

function bundleInput(overrides?: Parameters<typeof makeBookingInput>[0]) {
  return makeBookingInput({
    serviceId: undefined,
    serviceIds: [FIRST_ID, SECOND_ID],
    ...overrides,
  });
}

beforeEach(() => {
  resetServiceMocks();
  catalogStubs.categoryById = makeCategoryRow();
  catalogStubs.servicesById.set(
    FIRST_ID,
    makeServiceRow({
      name: "Thay dầu động cơ",
      base_price: 199000,
      duration_min: 60,
    }),
  );
  catalogStubs.servicesById.set(
    SECOND_ID,
    makeServiceRow({
      service_id: SECOND_ID,
      name: "Kiểm tra phanh",
      base_price: 101000,
      duration_min: 120,
    }),
  );
  serviceStubs.userById = makeUserRow({ role: "mechanic", status: "active" });
});

describe("createCustomerBooking with multiple services", () => {
  test("creates one booking with every price and duration snapshot", async () => {
    const result = await createCustomerBooking(makePublicUser(), bundleInput());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toMatchObject({
      total: 300000,
      durationMin: 180,
      serviceIds: [FIRST_ID, SECOND_ID],
      serviceName: "Thay dầu động cơ, Kiểm tra phanh",
    });
    expect(result.data.items).toMatchObject([
      {
        serviceId: FIRST_ID,
        unitPrice: 199000,
        lineTotal: 199000,
        durationMin: 60,
      },
      {
        serviceId: SECOND_ID,
        unitPrice: 101000,
        lineTotal: 101000,
        durationMin: 120,
      },
    ]);
    expect(bookingStubs.inserts).toHaveLength(1);
    expect(bookingStubs.inserts[0]).toMatchObject({
      subtotal: 300000,
      total: 300000,
      durationMin: 180,
      items: result.data.items,
    });
    expect(categoryRepoMocks.findCategoryRowById).toHaveBeenCalledTimes(1);
  });

  test("supports guests without splitting the request into multiple bookings", async () => {
    const result = await createCustomerBooking(
      null,
      bundleInput({
        fullName: "Guest Customer",
        phone: "0909999888",
        email: "guest@example.com",
      }),
    );
    expect(result.ok).toBe(true);
    expect(bookingStubs.inserts).toHaveLength(1);
    expect(bookingStubs.inserts[0]?.customerId).toBeNull();
    expect(bookingStubs.inserts[0]?.items).toHaveLength(2);
  });

  test("rejects an unavailable item before any booking or voucher write", async () => {
    catalogStubs.servicesById.set(
      SECOND_ID,
      makeServiceRow({ is_active: false }),
    );
    const result = await createCustomerBooking(makePublicUser(), bundleInput());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(404);
    expect(bookingStubs.inserts).toHaveLength(0);
    expect(voucherStubs.statusMarks).toHaveLength(0);
  });

  test("checks each distinct parent category", async () => {
    const categoryId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
    catalogStubs.servicesById.set(
      SECOND_ID,
      makeServiceRow({
        service_id: SECOND_ID,
        category_id: categoryId,
      }),
    );
    catalogStubs.categoriesById.set(
      categoryId,
      makeCategoryRow({ is_deleted: true }),
    );
    const result = await createCustomerBooking(makePublicUser(), bundleInput());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(404);
    expect(bookingStubs.inserts).toHaveLength(0);
  });

  test("does not bundle a service that cannot be performed at home", async () => {
    catalogStubs.servicesById.set(
      SECOND_ID,
      makeServiceRow({
        service_id: SECOND_ID,
        is_home_supported: false,
      }),
    );
    const result = await createCustomerBooking(makePublicUser(), bundleInput());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
    expect(bookingStubs.inserts).toHaveLength(0);
  });

  test("rejects a changed quote instead of silently charging a different price", async () => {
    const result = await createCustomerBooking(
      makePublicUser(),
      bundleInput({ expectedSubtotal: 1 }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(409);
    expect(bookingStubs.inserts).toHaveLength(0);
    expect(voucherStubs.statusMarks).toHaveLength(0);
  });

  test("applies one voucher to the combined subtotal", async () => {
    voucherStubs.campaignById = makeCampaignRow({
      scope: "booking",
      min_order: 250000,
    });
    voucherStubs.walletById = makeWalletRow();
    const result = await createCustomerBooking(
      makePublicUser({ id: VOUCHER_CUSTOMER_ID }),
      bundleInput({ walletId: VOUCHER_WALLET_ID }),
    );
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(result.data).toMatchObject({
        subtotal: 300000,
        discount: 50000,
        travelFee: 0,
        total: 250000,
      });
    expect(bookingStubs.inserts).toHaveLength(1);
    expect(voucherStubs.statusMarks).toHaveLength(1);
  });

  test("checks the entire visit when a customer chooses a mechanic", async () => {
    const input = bundleInput({ mechanicId: MECHANIC_ID });
    const otherTime = new Date(
      new Date(input.scheduledAt).getTime() + 2 * 60 * 60 * 1000,
    );
    mechanicStubs.profile = makeProfileRow();
    mechanicStubs.workloadRowsInRange = [
      makeWorkloadRow({
        booking_id: OTHER_BOOKING_ID,
        scheduled_at: otherTime,
      }),
    ];
    mechanicStubs.bookingRowsByIds = [
      makeBookingRow({
        booking_id: OTHER_BOOKING_ID,
        scheduled_at: otherTime,
        status: "confirmed",
      }),
    ];
    const result = await createCustomerBooking(makePublicUser(), input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(409);
    expect(bookingStubs.inserts).toHaveLength(0);
  });

  test("rejects durations too long to reserve as a single visit", async () => {
    for (const id of [FIRST_ID, SECOND_ID]) {
      catalogStubs.servicesById.set(
        id,
        makeServiceRow({ service_id: id, duration_min: 2880 }),
      );
    }
    const result = await createCustomerBooking(makePublicUser(), bundleInput());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
    expect(bookingStubs.inserts).toHaveLength(0);
  });
});
