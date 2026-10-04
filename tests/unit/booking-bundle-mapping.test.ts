import { describe, expect, test } from "bun:test";
import {
  groupItemsByBooking,
  toBookingSummary,
} from "@/lib/mechanic/mechanic-mapper";
import {
  BOOKING_ID,
  makeBookingItemRow,
  makeBookingRow,
  makeWorkloadRow,
} from "../helpers/mechanic.fixtures";

function items() {
  return (
    groupItemsByBooking([
      makeBookingItemRow({
        unit_price: 199000,
        line_total: 199000,
        duration_min: 60,
        price_unit: "per_job",
      }),
      makeBookingItemRow({
        service_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        unit_price: 101000,
        line_total: 101000,
        duration_min: 120,
        price_unit: "per_item",
      }),
    ]).get(BOOKING_ID) ?? []
  );
}

describe("bundle read models", () => {
  test("returns canonical totals, voucher and one travel fee even when the list index is stale", () => {
    const result = toBookingSummary({
      workload: makeWorkloadRow({ total: 450000 }),
      detail: makeBookingRow({
        subtotal: 300000,
        discount: 50000,
        travel_fee: 20000,
        total: 270000,
        duration_min: 180,
      }),
      status: "pending",
      items: items(),
    });
    expect(result).toMatchObject({
      subtotal: 300000,
      discount: 50000,
      travelFee: 20000,
      total: 270000,
      durationMin: 180,
    });
    expect(result.serviceNames).toHaveLength(2);
  });

  test("preserves line-item duration and price units", () => {
    const snapshots = items();
    expect(snapshots).toHaveLength(2);
    expect(
      snapshots.find((item) => item.priceUnit === "per_job")?.durationMin,
    ).toBe(60);
    expect(
      snapshots.find((item) => item.priceUnit === "per_item")?.durationMin,
    ).toBe(120);
    expect(
      snapshots.reduce((subtotal, item) => subtotal + item.lineTotal, 0),
    ).toBe(300000);
  });

  test("legacy rows use item prices and indexed totals without inventing a duration", () => {
    const result = toBookingSummary({
      workload: makeWorkloadRow({ total: 300000 }),
      detail: makeBookingRow({
        subtotal: null,
        discount: null,
        travel_fee: null,
        total: null,
        duration_min: null,
      }),
      status: "pending",
      items: items(),
    });
    expect(result).toMatchObject({
      subtotal: 300000,
      discount: 0,
      travelFee: 0,
      total: 300000,
      durationMin: null,
    });
  });
});
