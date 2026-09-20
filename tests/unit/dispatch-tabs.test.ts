// Dispatch board status tabs: one URL per status, dispatcher-facing labels,
// and the guard the route shell uses before rendering the board.
import { describe, expect, test } from "bun:test";
import {
  DEFAULT_DISPATCH_TAB,
  DISPATCH_STATUS_LABELS,
  DISPATCH_TABS,
  dispatchTabHref,
  isDispatchTab,
} from "@/app/dispatch/components/bookings/dispatch-tabs";
import { MECHANIC_BOOKING_STATUSES } from "@/lib/mechanic/mechanic-status";

describe("DISPATCH_TABS", () => {
  test("covers every booking status exactly once, in workflow order", () => {
    expect(DISPATCH_TABS.map((tab) => tab.id)).toEqual(
      MECHANIC_BOOKING_STATUSES,
    );
    expect(new Set(DISPATCH_TABS.map((tab) => tab.id)).size).toBe(
      DISPATCH_TABS.length,
    );
  });

  test("every tab links to its own /dispatch URL", () => {
    for (const tab of DISPATCH_TABS) {
      expect(tab.href).toBe(`/dispatch/bookings/${tab.id}`);
      expect(dispatchTabHref(tab.id)).toBe(tab.href);
    }
  });

  test("labels are Vietnamese with diacritics for every status", () => {
    for (const status of MECHANIC_BOOKING_STATUSES) {
      expect(DISPATCH_STATUS_LABELS[status].length).toBeGreaterThan(0);
    }
    expect(DISPATCH_STATUS_LABELS.pending).toBe("Chờ xử lý");
  });

  test("the default tab is the dispatcher inbox", () => {
    expect(DEFAULT_DISPATCH_TAB).toBe("pending");
  });
});

describe("isDispatchTab", () => {
  test("accepts real statuses and rejects anything else", () => {
    for (const tab of DISPATCH_TABS) {
      expect(isDispatchTab(tab.id)).toBe(true);
    }
    for (const bad of ["all", "", "pending ", "PENDING", null, 42, {}]) {
      expect(isDispatchTab(bad)).toBe(false);
    }
  });
});
