import { beforeEach, describe, expect, mock, test } from "bun:test";
import { metricRepoMocks, metricStubs, metricStubKey, resetMetricMocks } from "../helpers/metrics.mocks";
import { mechanicBookingsRepoMocks, mechanicStubs, resetMechanicMocks } from "../helpers/mechanic.mocks";
import { BOOKING_ID, CUSTOMER_ID, MECHANIC_ID, makeBookingRow, makeReviewRow, makeWorkloadRow } from "../helpers/mechanic.fixtures";
import { metricReceipt } from "../helpers/metrics.fixtures";

mock.module("@/lib/operations/metrics.repository", () => metricRepoMocks);
mock.module("@/lib/mechanic/mechanic-bookings.repository", () => mechanicBookingsRepoMocks);
const statusRefs = mock(async (_status: string, _month: string, _limit: number, _state?: string | null) => ({ rows: [{ booking_id: BOOKING_ID, scheduled_at: new Date() }], pageState: null as string | null }));
mock.module("@/lib/dispatch/dispatch.repository", () => ({ listStatusBookingRefs: statusRefs }));

import { captureBookingMetric, captureMechanicMetrics, captureMechanicRatings, captureOperationsMetrics, metricPages } from "@/lib/operations/metric-capture.service";
import { getOperationsSnapshot } from "@/lib/operations/operations.service";
import { makePublicUser } from "../helpers/auth.fixtures";

beforeEach(() => {
  resetMetricMocks();
  resetMechanicMocks();
  statusRefs.mockClear();
  mechanicBookingsRepoMocks.listWorkloadPage.mockImplementation(async () => ({ rows: [], pageState: null }));
  mechanicBookingsRepoMocks.listBookingRowsByIds.mockImplementation(async () => mechanicStubs.bookingRowsByIds);
});

describe("metric source capture", () => {
  test("reads every payment page, verifies canonical ref/customer, and includes a stable receipt before projection repair", async () => {
    const booking = makeBookingRow({ status: "completed" });
    metricStubs.refs.set(metricStubKey(BOOKING_ID, null), { rows: ["foreign", "valid", "valid"], pageState: "next" });
    metricStubs.refs.set(metricStubKey(BOOKING_ID, "next"), { rows: ["wrong-type", "missing", "wrong-owner"], pageState: null });
    metricStubs.receipts.set(BOOKING_ID, metricReceipt({ payment_id: BOOKING_ID, amount: 100 }));
    metricStubs.receipts.set("valid", metricReceipt({ payment_id: "valid", amount: 200 }));
    metricStubs.receipts.set("foreign", metricReceipt({ payment_id: "foreign", ref_id: "other" }));
    metricStubs.receipts.set("wrong-type", metricReceipt({ payment_id: "wrong-type", ref_type: "order" }));
    metricStubs.receipts.set("wrong-owner", metricReceipt({ payment_id: "wrong-owner", customer_id: "other" }));
    metricStubs.history.set(metricStubKey(BOOKING_ID, null), { rows: [{ status: "in_progress", at: new Date("2026-09-16T00:00:00Z") }], pageState: "history-next" });
    metricStubs.history.set(metricStubKey(BOOKING_ID, "history-next"), { rows: [{ status: "completed", at: new Date("2026-09-17T00:00:00Z") }], pageState: null });
    const captured = await captureBookingMetric(booking);
    expect(captured.payments.map((receipt) => receipt.amount)).toEqual([100, 200]);
    expect(metricRepoMocks.metricReceiptById.mock.calls.filter(([id]) => id === "valid")).toHaveLength(1);
    expect(captured.completedAt?.toISOString()).toBe("2026-09-17T00:00:00.000Z");
    expect(metricRepoMocks.metricPaymentRefs.mock.calls).toEqual([[BOOKING_ID, null], [BOOKING_ID, "next"]]);
  });

  test("mechanic capture traverses all workload pages and excludes reassigned canonical rows", async () => {
    const first = makeBookingRow({ booking_id: "first", status: "pending" });
    const second = makeBookingRow({ booking_id: "second", status: "pending" });
    const foreign = makeBookingRow({ booking_id: "foreign", mechanic_id: "other", status: "pending" });
    mechanicBookingsRepoMocks.listWorkloadPage.mockImplementation(async (_id, state) => ({
      rows: (state ? ["first", "second"] : ["first", "foreign"]).map((booking_id) => makeWorkloadRow({ booking_id })),
      pageState: state ? null : "next",
    }));
    const canonical = new Map([first, second, foreign].map((row) => [row.booking_id, row]));
    mechanicBookingsRepoMocks.listBookingRowsByIds.mockImplementation(async (ids) => ids.flatMap((id) => canonical.get(id) ?? []));
    const captured = await captureMechanicMetrics(MECHANIC_ID);
    expect(captured.map((record) => record.booking.booking_id)).toEqual(["first", "second"]);
    expect(mechanicBookingsRepoMocks.listWorkloadPage.mock.calls).toEqual([[MECHANIC_ID, null], [MECHANIC_ID, "next"]]);
  });

  test("operations capture deduplicates status projections and trusts canonical status/month", async () => {
    mechanicStubs.bookingRowsByIds = [makeBookingRow({ status: "in_progress", month_bucket: "2026-09" })];
    const captured = await captureOperationsMetrics("2026-09");
    expect(captured).toHaveLength(1);
    expect(captured[0].status).toBe("in_progress");
    expect(statusRefs.mock.calls).toHaveLength(8);
    expect(mechanicBookingsRepoMocks.listBookingRowsByIds.mock.calls.filter(([ids]) => ids.length > 0)).toHaveLength(1);
  });

  test("ratings cover more than 50 reviews, exclude invalid rows and deduplicate bookings", async () => {
    const rows = Array.from({ length: 60 }, (_, index) => makeReviewRow({ review_id: `review-${index}`, booking_id: `booking-${index}`, rating: index < 50 ? 5 : 1 }));
    metricStubs.reviews.set(metricStubKey(MECHANIC_ID, null), { rows: rows.slice(0, 50), pageState: "next" });
    metricStubs.reviews.set(metricStubKey(MECHANIC_ID, "next"), { rows: [...rows.slice(50), rows[0], makeReviewRow({ booking_id: "invalid", rating: 2.5 }), makeReviewRow({ booking_id: "foreign", target_id: CUSTOMER_ID })], pageState: null });
    const ratings = await captureMechanicRatings(MECHANIC_ID);
    expect(ratings.count).toBe(60);
    expect(ratings.average).toBe(4.3);
    expect(ratings.distribution).toEqual([{ stars: 5, count: 50 }, { stars: 4, count: 0 }, { stars: 3, count: 0 }, { stars: 2, count: 0 }, { stars: 1, count: 10 }]);
  });

  test("fails loudly rather than publishing a partial scan if paging repeats", async () => {
    const run = async () => {
      for await (const _rows of metricPages(async () => ({ rows: [], pageState: "same" }))) { }
    };
    await expect(run()).rejects.toThrow("repeated a paging state");
  });

  test("rejects unauthorized users and invalid months before source reads", async () => {
    const customer = makePublicUser({ role: "customer" });
    expect(await getOperationsSnapshot(customer, "2026-09")).toMatchObject({ ok: false, status: 403 });
    const dispatcher = makePublicUser({ role: "dispatcher" });
    expect(await getOperationsSnapshot(dispatcher, "2026-99")).toMatchObject({ ok: false, status: 400 });
    expect(statusRefs).not.toHaveBeenCalled();
  });
});
