// Geometry and Vietnam-local calendar helpers for the mechanic workspace.
// Pure modules, so no mocks are needed anywhere in this file.
import { describe, expect, test } from "bun:test";
import {
  boundingBoxAround,
  boundingBoxOfPoints,
  CITY_AVG_SPEED_KMH,
  estimateEtaMin,
  haversineKm,
  isValidLatitude,
  isValidLongitude,
} from "@/lib/mechanic/mechanic-geo";
import {
  dayKey,
  isSameDay,
  isSameMonth,
  isSameWeek,
  MECHANIC_TIME_ZONE,
  monthKey,
  recentMonthKeys,
  weekKey,
} from "@/lib/mechanic/mechanic-period";

describe("geo validation", () => {
  test("rejects out-of-range coordinates for Ho Chi Minh City data", () => {
    expect(isValidLatitude(10.772)).toBe(true);
    expect(isValidLatitude(91)).toBe(false);
    expect(isValidLatitude("10.7")).toBe(false);
    expect(isValidLongitude(106.698)).toBe(true);
    expect(isValidLongitude(-181)).toBe(false);
    expect(isValidLongitude(Number.NaN)).toBe(false);
  });
});

describe("haversineKm", () => {
  test("measures District 1 to Binh Thanh as a few kilometers", () => {
    const distance = haversineKm(
      { lat: 10.772291, lng: 106.698007 },
      { lat: 10.786567, lng: 106.70441 },
    );
    expect(distance).toBeGreaterThan(1);
    expect(distance).toBeLessThan(5);
  });

  test("stays symmetric and zero for the same point", () => {
    const point = { lat: 10.77, lng: 106.7 };
    expect(haversineKm(point, point)).toBe(0);
    const other = { lat: 10.8, lng: 106.72 };
    expect(haversineKm(point, other)).toBe(haversineKm(other, point));
  });
});

describe("estimateEtaMin", () => {
  test("derives minutes from the city average speed", () => {
    expect(CITY_AVG_SPEED_KMH).toBeGreaterThan(0);
    expect(estimateEtaMin(12, 24)).toBe(30);
    expect(estimateEtaMin(0)).toBe(1);
    expect(estimateEtaMin(-3)).toBe(1);
  });
});

describe("bounding boxes", () => {
  test("pads a center on every side", () => {
    const box = boundingBoxAround({ lat: 10.77, lng: 106.7 }, 2);
    expect(box.minLat).toBeLessThan(10.77);
    expect(box.maxLat).toBeGreaterThan(10.77);
    expect(box.minLng).toBeLessThan(106.7);
    expect(box.maxLng).toBeGreaterThan(106.7);
  });

  test("covers a set of points and nothing without points", () => {
    expect(boundingBoxOfPoints([])).toBeNull();
    const box = boundingBoxOfPoints([
      { lat: 10.77, lng: 106.7 },
      { lat: 10.79, lng: 106.72 },
    ]);
    expect(box).not.toBeNull();
    expect(box?.minLat).toBeLessThan(10.77);
    expect(box?.maxLng).toBeGreaterThan(106.72);
  });
});

describe("Vietnam calendar keys", () => {
  test("uses the Asia/Ho_Chi_Minh zone identifier", () => {
    expect(MECHANIC_TIME_ZONE).toBe("Asia/Ho_Chi_Minh");
  });

  test("23:30 UTC is already the next day in Vietnam", () => {
    const late = new Date("2026-09-16T23:30:00.000Z");
    expect(dayKey(late)).toBe("2026-09-17");
    expect(monthKey(late)).toBe("2026-09");
  });

  test("month buckets follow the zone wall-month, never UTC", () => {
    // 2026-09-30T17:30Z is Oct 1st 00:30 in +07 but still September in
    // UTC: dispatchers must file it under October.
    const edge = new Date("2026-09-30T17:30:00.000Z");
    expect(monthKey(edge, "Asia/Ho_Chi_Minh")).toBe("2026-10");
    expect(monthKey(edge, "UTC")).toBe("2026-09");
    expect(monthKey(edge, "America/New_York")).toBe("2026-09");
  });

  test("groups days, weeks and months around the reference", () => {
    // Wednesday 2026-09-16 in Vietnam.
    const reference = new Date("2026-09-16T03:00:00.000Z");
    const sameDayLate = new Date("2026-09-16T16:00:00.000Z");
    const previousDay = new Date("2026-09-15T16:00:00.000Z");
    expect(isSameDay(sameDayLate, reference)).toBe(true);
    expect(isSameDay(previousDay, reference)).toBe(false);

    // Monday 2026-09-14 starts the same week.
    const monday = new Date("2026-09-14T03:00:00.000Z");
    const sunday = new Date("2026-09-20T03:00:00.000Z");
    const nextMonday = new Date("2026-09-21T03:00:00.000Z");
    expect(weekKey(reference)).toBe("2026-09-14");
    expect(isSameWeek(monday, reference)).toBe(true);
    expect(isSameWeek(sunday, reference)).toBe(true);
    expect(isSameWeek(nextMonday, reference)).toBe(false);

    const previousMonth = new Date("2026-08-16T03:00:00.000Z");
    expect(isSameMonth(reference, reference)).toBe(true);
    expect(isSameMonth(previousMonth, reference)).toBe(false);
  });

  test("lists the last months oldest first", () => {
    const reference = new Date("2026-09-16T03:00:00.000Z");
    expect(recentMonthKeys(reference, 3)).toEqual([
      "2026-07",
      "2026-08",
      "2026-09",
    ]);
  });
});
