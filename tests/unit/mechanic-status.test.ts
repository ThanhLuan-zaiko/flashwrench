// Transition rules for the mechanic booking workflow. Pure module, so no
// mocks are needed anywhere in this file.
import { describe, expect, test } from "bun:test";
import type { MechanicBookingStatus } from "@/lib/mechanic/mechanic.types";
import {
  ACTION_ALLOWED_FROM,
  ACTION_LABELS,
  ACTION_TARGET_STATUS,
  availabilityAfterAction,
  availableActions,
  canApplyAction,
  isMechanicBookingAction,
  isMechanicBookingStatus,
  type MechanicBookingAction,
  monthBucketOf,
  parseBookingStatus,
  STATUS_LABELS,
  transitionError,
} from "@/lib/mechanic/mechanic-status";

describe("parseBookingStatus", () => {
  test("accepts the workflow statuses and rejects unknown ones", () => {
    expect(parseBookingStatus("pending")).toBe("pending");
    expect(parseBookingStatus("in_progress")).toBe("in_progress");
    expect(parseBookingStatus("no_show")).toBe("no_show");
    expect(parseBookingStatus("shipped")).toBeNull();
    expect(parseBookingStatus(null)).toBeNull();
    expect(parseBookingStatus(undefined)).toBeNull();
  });

  test("every status and action has a Vietnamese label", () => {
    for (const status of Object.keys(STATUS_LABELS)) {
      expect(
        STATUS_LABELS[status as MechanicBookingStatus].length,
      ).toBeGreaterThan(0);
    }
    for (const action of Object.keys(ACTION_LABELS)) {
      expect(
        ACTION_LABELS[action as MechanicBookingAction].length,
      ).toBeGreaterThan(0);
    }
  });
});

describe("canApplyAction", () => {
  test("a mechanic can only run one workflow step at a time", () => {
    expect(canApplyAction("accept", "pending")).toBe(true);
    expect(canApplyAction("accept", "confirmed")).toBe(false);
    expect(canApplyAction("start-travel", "confirmed")).toBe(true);
    expect(canApplyAction("start-travel", "mechanic_assigned")).toBe(true);
    expect(canApplyAction("start-travel", "pending")).toBe(false);
    expect(canApplyAction("start-work", "en_route")).toBe(true);
    expect(canApplyAction("start-work", "mechanic_assigned")).toBe(false);
    expect(canApplyAction("complete", "in_progress")).toBe(true);
    expect(canApplyAction("complete", "en_route")).toBe(false);
    expect(canApplyAction("mark-no-show", "en_route")).toBe(true);
  });

  test("cancel is blocked once the wrench is out", () => {
    expect(canApplyAction("cancel", "confirmed")).toBe(true);
    expect(canApplyAction("cancel", "mechanic_assigned")).toBe(true);
    expect(canApplyAction("cancel", "en_route")).toBe(true);
    expect(canApplyAction("cancel", "in_progress")).toBe(false);
    expect(canApplyAction("decline", "pending")).toBe(true);
  });

  test("terminal states offer no actions", () => {
    for (const status of ["completed", "cancelled", "no_show"] as const) {
      expect(availableActions(status)).toEqual([]);
    }
    expect(availableActions("pending")).toEqual(["accept", "decline"]);
    expect(availableActions("en_route")).toEqual([
      "start-work",
      "cancel",
      "mark-no-show",
    ]);
  });
});

describe("availabilityAfterAction", () => {
  test("moving out marks the mechanic busy, closing frees them", () => {
    expect(availabilityAfterAction("start-travel")).toBe(false);
    expect(availabilityAfterAction("start-work")).toBe(false);
    expect(availabilityAfterAction("complete")).toBe(true);
    expect(availabilityAfterAction("cancel")).toBe(true);
    expect(availabilityAfterAction("mark-no-show")).toBe(true);
    expect(availabilityAfterAction("accept")).toBeNull();
    expect(availabilityAfterAction("decline")).toBeNull();
  });
});

describe("transitionError", () => {
  test("names the current state and the allowed ones", () => {
    const message = transitionError("complete", "en_route");
    expect(message).toContain("Hoàn thành đơn");
    expect(message).toContain("Đang di chuyển");
    expect(message).toContain("Đang sửa xe");
  });
});

describe("guards", () => {
  test("rejects unknown actions and statuses", () => {
    expect(isMechanicBookingAction("fly")).toBe(false);
    expect(isMechanicBookingAction("complete")).toBe(true);
    expect(isMechanicBookingStatus("pending")).toBe(true);
    expect(isMechanicBookingStatus("delivered")).toBe(false);
  });

  test("targets and sources stay consistent", () => {
    for (const [action, target] of Object.entries(ACTION_TARGET_STATUS)) {
      expect(
        ACTION_ALLOWED_FROM[action as keyof typeof ACTION_ALLOWED_FROM],
      ).not.toContain(target);
    }
  });

  test("month buckets stay UTC stable", () => {
    expect(monthBucketOf(new Date("2026-09-16T10:00:00.000Z"))).toBe("2026-09");
    expect(monthBucketOf(new Date("2026-01-01T00:30:00.000Z"))).toBe("2026-01");
  });
});
