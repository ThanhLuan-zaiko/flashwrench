// Dispatch workflow rules mirrored from lib/dispatch/dispatch.service.ts:
// assign/cancel exist only while the booking is still touchable, and
// confirm exists only for unassigned pending bookings.
import { describe, expect, test } from "bun:test";
import {
  assignActionLabel,
  canDispatchTouch,
  DISPATCH_ACTION_LABELS,
  dispatchActionsFor,
} from "@/app/dispatch/components/bookings/dispatch-actions";
import { MECHANIC_BOOKING_STATUSES } from "@/lib/mechanic/mechanic-status";

describe("dispatchActionsFor", () => {
  test("pending without a mechanic offers assign, confirm, cancel", () => {
    expect(dispatchActionsFor("pending", false)).toEqual([
      "assign",
      "confirm",
      "cancel",
    ]);
  });

  test("pending with a mechanic cannot be confirmed again", () => {
    expect(dispatchActionsFor("pending", true)).toEqual(["assign", "cancel"]);
  });

  test("confirmed and mechanic_assigned allow reassign and cancel", () => {
    for (const status of ["confirmed", "mechanic_assigned"] as const) {
      expect(dispatchActionsFor(status, true)).toEqual(["assign", "cancel"]);
      expect(dispatchActionsFor(status, false)).toEqual(["assign", "cancel"]);
    }
  });

  test("terminal and in-flight statuses offer nothing", () => {
    for (const status of [
      "en_route",
      "in_progress",
      "completed",
      "cancelled",
      "no_show",
    ] as const) {
      expect(dispatchActionsFor(status, true)).toEqual([]);
      expect(canDispatchTouch(status)).toBe(false);
    }
  });

  test("every status resolves to a known action list", () => {
    for (const status of MECHANIC_BOOKING_STATUSES) {
      const actions = dispatchActionsFor(status, false);
      for (const action of actions) {
        expect(DISPATCH_ACTION_LABELS[action].length).toBeGreaterThan(0);
      }
    }
  });
});

describe("assignActionLabel", () => {
  test("reads 'assign' without a mechanic and 'swap' with one", () => {
    expect(assignActionLabel(false)).toBe("Phân công thợ");
    expect(assignActionLabel(true)).toBe("Đổi thợ phụ trách");
  });
});
