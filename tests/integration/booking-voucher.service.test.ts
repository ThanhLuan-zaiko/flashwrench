// Booking spends account-bound wallets and cancels return them:
// simulated totals, guest rejection and storage-untouched guards.
import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makePublicUser } from "../helpers/auth.fixtures";
import { makeBookingInput } from "../helpers/booking.fixtures";
import { makeCategoryRow, makeServiceRow } from "../helpers/catalog.fixtures";
import { makeBookingRow } from "../helpers/mechanic.fixtures";
import {
  bookingRepoMocks,
  bookingStubs,
  catalogServiceRepoMocks,
  catalogStubs,
  categoryRepoMocks,
  mechanicBookingsRepoMocks,
  mechanicStubs,
  mechanicWorkspaceRepoMocks,
  resetServiceMocks,
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
  dispatchRepoMocks,
  domainPublishMocks,
  resetWorkspaceMocks,
  vehicleRepoMocks,
} from "../helpers/workspace.mocks";

// Helpers first, mocks second, system under test last.
mock.module("@/lib/booking/booking.repository", () => bookingRepoMocks);
mock.module(
  "@/lib/booking/booking-workflow.repository",
  () => bookingWorkflowRepoMocks,
);
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
import { cancelCustomerBooking } from "@/lib/booking/customer-booking.service";
import { bookingWorkflowRepoMocks } from "../helpers/mechanic.mocks";

const BOOKING_CAMPAIGN = () =>
  makeCampaignRow({ scope: "booking", min_order: 100000 });

beforeEach(() => {
  resetServiceMocks();
  resetWorkspaceMocks();
  catalogStubs.serviceById = makeServiceRow({ base_price: 199000 });
  catalogStubs.categoryById = makeCategoryRow();
  voucherStubs.campaignById = BOOKING_CAMPAIGN();
  voucherStubs.walletById = makeWalletRow();
  voucherStubs.userCampaignCount = 0;
});

describe("createCustomerBooking with wallet", () => {
  test("applies the voucher and writes simulated discounted totals", async () => {
    const customer = makePublicUser({ id: VOUCHER_CUSTOMER_ID });
    const result = await createCustomerBooking(
      customer,
      makeBookingInput({ walletId: VOUCHER_WALLET_ID }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // 199000 - 50000 simulated.
    expect(result.data.total).toBe(149000);
    expect(bookingStubs.inserts).toHaveLength(1);
    expect(bookingStubs.inserts[0]).toMatchObject({
      subtotal: 199000,
      discount: 50000,
      couponCode: VOUCHER_WALLET_ID,
      total: 149000,
    });
    expect(voucherStubs.statusMarks).toMatchObject([
      { walletId: VOUCHER_WALLET_ID, status: "used" },
    ]);
  });

  test("guest wallets are rejected without touching storage", async () => {
    const result = await createCustomerBooking(
      null,
      makeBookingInput({ walletId: VOUCHER_WALLET_ID }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(bookingStubs.inserts).toHaveLength(0);
    expect(voucherStubs.statusMarks).toHaveLength(0);
  });

  test("order-scope campaign is rejected without touching storage", async () => {
    voucherStubs.campaignById = makeCampaignRow({ scope: "order" });
    const customer = makePublicUser({ id: VOUCHER_CUSTOMER_ID });

    const result = await createCustomerBooking(
      customer,
      makeBookingInput({ walletId: VOUCHER_WALLET_ID }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(bookingStubs.inserts).toHaveLength(0);
    expect(voucherStubs.statusMarks).toHaveLength(0);
  });
});

describe("cancelCustomerBooking with wallet", () => {
  test("returns the spent wallet to the owner", async () => {
    const bookingId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
    mechanicStubs.bookingById = makeBookingRow({
      booking_id: bookingId,
      customer_id: VOUCHER_CUSTOMER_ID,
      mechanic_id: null,
      status: "pending",
      coupon_code: VOUCHER_WALLET_ID,
    });
    voucherStubs.walletById = makeWalletRow({
      status: "used",
      used_booking_id: bookingId,
    });

    const result = await cancelCustomerBooking(
      VOUCHER_CUSTOMER_ID,
      bookingId,
      "Doi lich ban",
    );

    expect(result.ok).toBe(true);
    expect(voucherStubs.statusMarks).toMatchObject([
      { walletId: VOUCHER_WALLET_ID, status: "active" },
    ]);
    expect(voucherRealtimeMocks.publishWalletChange.mock.calls.length).toBe(1);
  });

  test("bookings without a wallet cancel without wallet writes", async () => {
    const bookingId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
    mechanicStubs.bookingById = makeBookingRow({
      booking_id: bookingId,
      customer_id: VOUCHER_CUSTOMER_ID,
      mechanic_id: null,
      status: "pending",
      coupon_code: null,
    });

    const result = await cancelCustomerBooking(
      VOUCHER_CUSTOMER_ID,
      bookingId,
      "Doi lich ban",
    );

    expect(result.ok).toBe(true);
    expect(voucherStubs.statusMarks).toHaveLength(0);
  });
});
