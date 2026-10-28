import { describe, expect, test } from "bun:test";
import {
  countActiveGuestRecords,
  GUEST_LOOKUP_HREF,
  guestMenuLabel,
  guestRecordHref,
  isActiveGuestRecord,
} from "@/components/layout/guest-records-menu.utils";
import type { GuestRecordSummary } from "@/lib/guest-access/guest-access.types";

function record(
  overrides: Partial<GuestRecordSummary> = {},
): GuestRecordSummary {
  return {
    type: "booking",
    id: "11111111-1111-4111-8111-111111111111",
    title: "Thay dầu",
    status: "pending",
    createdAt: "2026-10-28T08:00:00.000Z",
    scheduledAt: null,
    total: 150000,
    mechanicName: null,
    trackHref: "/track/booking/11111111-1111-4111-8111-111111111111",
    ...overrides,
  };
}

describe("isActiveGuestRecord", () => {
  test("in-flight statuses count as active", () => {
    for (const status of ["pending", "confirmed", "en_route", "shipped"]) {
      expect(isActiveGuestRecord(record({ status }))).toBe(true);
    }
  });

  test("terminal statuses do not", () => {
    for (const status of ["completed", "cancelled", "resolved", "delivered"]) {
      expect(isActiveGuestRecord(record({ status }))).toBe(false);
    }
  });
});

describe("countActiveGuestRecords", () => {
  test("counts only jobs that are still moving", () => {
    const records = [
      record({ status: "pending" }),
      record({ status: "completed" }),
      record({ type: "order", status: "shipped" }),
    ];
    expect(countActiveGuestRecords(records)).toBe(2);
    expect(countActiveGuestRecords([])).toBe(0);
  });
});

describe("guestRecordHref", () => {
  test("links to live tracking when the record has it", () => {
    const row = record();
    expect(guestRecordHref(row)).toBe(row.trackHref as string);
  });

  // Rescues have no public tracking page yet; the OTP lookup still lists
  // them, so the row must never become a dead link.
  test("falls back to the OTP lookup without a tracking page", () => {
    const rescue = record({ type: "rescue", trackHref: null });
    expect(guestRecordHref(rescue)).toBe(GUEST_LOOKUP_HREF);
  });
});

describe("guestMenuLabel", () => {
  test("announces the active count and the open state", () => {
    expect(guestMenuLabel(2, false)).toBe("Đơn của bạn, 2 đơn đang xử lý");
    expect(guestMenuLabel(0, false)).toBe("Đơn của bạn");
    expect(guestMenuLabel(2, true)).toBe("Đóng danh sách đơn của bạn");
  });
});
