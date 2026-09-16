// UI formatting and paging guards for the mechanic workspace: currency,
// schedule dates, distances and the 8-per-page queue pager. Pure module,
// so no mocks are needed anywhere in this file.
import { describe, expect, test } from "bun:test";
import {
  clampMechanicPage,
  formatDistanceKm,
  formatEtaMin,
  formatMonthLabel,
  formatScheduleDateTime,
  formatShortDate,
  formatVnd,
  incomeStateLabel,
  MECHANIC_PAGE_SIZE,
  pageCountOf,
  pageRangeLabel,
  paginateMechanicItems,
  paymentStateLabel,
  statusTone,
} from "@/app/mechanic/components/mechanic-format";

describe("formatVnd", () => {
  test("formats Vietnamese dong without decimals", () => {
    expect(formatVnd(450000)).toBe("450.000đ");
    expect(formatVnd(0)).toBe("0đ");
  });
});

describe("schedule dates", () => {
  test("falls back gracefully on missing values", () => {
    expect(formatScheduleDateTime(null)).toBe("Chưa hẹn giờ");
    expect(formatScheduleDateTime("not-a-date")).toBe("Chưa hẹn giờ");
    expect(formatShortDate(null)).toBe("—");
    expect(formatMonthLabel("2026-09")).toBe("Tháng 9/2026");
    expect(formatMonthLabel("broken")).toBe("broken");
  });

  test("shows the time even for distant dates", () => {
    const rendered = formatScheduleDateTime("2026-09-16T07:00:00.000Z");
    expect(rendered).toContain("14:00");
  });
});

describe("distances and ETAs", () => {
  test("switches to meters under one kilometer", () => {
    expect(formatDistanceKm(2.35)).toBe("2.4 km");
    expect(formatDistanceKm(0.45)).toBe("450 m");
    expect(formatDistanceKm(0)).toBe("—");
  });

  test("collapses long trips into hours", () => {
    expect(formatEtaMin(25)).toBe("~25 phút");
    expect(formatEtaMin(90)).toBe("~1 giờ 30 phút");
    expect(formatEtaMin(120)).toBe("~2 giờ");
    expect(formatEtaMin(0)).toBe("—");
  });
});

describe("state labels", () => {
  test("names payment and income states in Vietnamese", () => {
    expect(paymentStateLabel("paid")).toBe("Đã thanh toán");
    expect(paymentStateLabel("refunded")).toBe("Đã hoàn tiền");
    expect(paymentStateLabel("unpaid")).toBe("Chưa thanh toán");
    expect(incomeStateLabel("paid")).toBe("Đã thu");
    expect(incomeStateLabel("pending")).toBe("Chờ thu");
    expect(incomeStateLabel("refunded")).toBe("Đã hoàn");
  });

  test("gives the completed pill the inverted tone", () => {
    expect(statusTone("completed")).toContain("bg-zinc-900");
    expect(statusTone("pending")).toContain("bg-zinc-100");
    expect(statusTone("cancelled")).toContain("bg-white");
  });
});

describe("mechanic pager", () => {
  test("uses eight rows per page", () => {
    expect(MECHANIC_PAGE_SIZE).toBe(8);
    expect(pageCountOf(0)).toBe(1);
    expect(pageCountOf(8)).toBe(1);
    expect(pageCountOf(9)).toBe(2);
  });

  test("clamps out-of-range pages and slices the range", () => {
    const items = Array.from({ length: 10 }, (_, index) => index);
    expect(clampMechanicPage(9, items.length)).toBe(1);
    expect(clampMechanicPage(-2, items.length)).toBe(0);
    expect(paginateMechanicItems(items, 1)).toEqual([8, 9]);
    expect(pageRangeLabel(0, 10)).toEqual({ start: 1, end: 8 });
    expect(pageRangeLabel(1, 10)).toEqual({ start: 9, end: 10 });
    expect(pageRangeLabel(0, 0)).toEqual({ start: 0, end: 0 });
  });
});
