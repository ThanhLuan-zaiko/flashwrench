import { describe, expect, test } from "bun:test";
import {
  isTrackableStatus,
  paymentStateLabel,
  splitBookings,
  statusChipTone,
  trackingHeadline,
} from "../../components/history/history.utils";
import type { MechanicBookingStatus } from "../../lib/mechanic/mechanic.types";

describe("isTrackableStatus", () => {
  test("only en_route and in_progress expose the live pin", () => {
    expect(isTrackableStatus("en_route")).toBe(true);
    expect(isTrackableStatus("in_progress")).toBe(true);
    for (const status of [
      "pending",
      "confirmed",
      "mechanic_assigned",
      "completed",
      "cancelled",
      "no_show",
    ] as MechanicBookingStatus[]) {
      expect(isTrackableStatus(status)).toBe(false);
    }
  });
});

describe("splitBookings", () => {
  const row = (id: string, status: MechanicBookingStatus) => ({
    id,
    status,
  });

  test("open statuses land in active, terminal ones in past", () => {
    const items = [
      row("a", "completed"),
      row("b", "en_route"),
      row("c", "cancelled"),
      row("d", "pending"),
      row("e", "no_show"),
      row("f", "mechanic_assigned"),
    ];
    const { active, past } = splitBookings(items);
    expect(active.map((item) => item.id)).toEqual(["b", "d", "f"]);
    expect(past.map((item) => item.id)).toEqual(["a", "c", "e"]);
  });

  test("empty input gives two empty buckets", () => {
    const { active, past } = splitBookings([]);
    expect(active).toEqual([]);
    expect(past).toEqual([]);
  });
});

describe("paymentStateLabel", () => {
  test("maps every payment state to Vietnamese copy", () => {
    expect(paymentStateLabel("paid")).toBe("Đã thanh toán");
    expect(paymentStateLabel("unpaid")).toBe("Chưa thanh toán");
    expect(paymentStateLabel("refunded")).toBe("Đã hoàn tiền");
  });
});

describe("statusChipTone / trackingHeadline", () => {
  test("every status has a chip tone", () => {
    const statuses: MechanicBookingStatus[] = [
      "pending",
      "confirmed",
      "mechanic_assigned",
      "en_route",
      "in_progress",
      "completed",
      "cancelled",
      "no_show",
    ];
    for (const status of statuses) {
      expect(statusChipTone(status).length).toBeGreaterThan(0);
    }
  });

  test("tracking headline follows the live status", () => {
    expect(trackingHeadline("en_route")).toBe("Thợ đang trên đường tới");
    expect(trackingHeadline("in_progress")).toBe("Thợ đang sửa xe");
  });
});
