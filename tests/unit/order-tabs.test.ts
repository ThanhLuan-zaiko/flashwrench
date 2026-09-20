// Dispatch order tabs: one URL per status, pending is the landing tab and
// unknown slugs fail the guard instead of falling back silently.
import { describe, expect, test } from "bun:test";
import {
  DEFAULT_ORDER_TAB,
  DISPATCH_ORDER_TABS,
  isDispatchOrderTab,
  ORDER_TAB_LABELS,
} from "@/app/dispatch/components/orders/order-tabs";
import { ORDER_STATUSES } from "@/lib/orders/orders.types";

describe("dispatch order tabs", () => {
  test("every order status owns one tab with a matching URL", () => {
    expect(DISPATCH_ORDER_TABS).toHaveLength(ORDER_STATUSES.length);
    for (const status of ORDER_STATUSES) {
      const tab = DISPATCH_ORDER_TABS.find((t) => t.id === status);
      expect(tab).toBeDefined();
      expect(tab?.href).toBe(`/dispatch/orders/${status}`);
      expect(ORDER_TAB_LABELS[status].length).toBeGreaterThan(0);
    }
  });

  test("pending is the default landing tab", () => {
    expect(DEFAULT_ORDER_TAB).toBe("pending");
    expect(DISPATCH_ORDER_TABS[0]?.id).toBe("pending");
  });

  test("the guard accepts statuses and rejects unknown slugs", () => {
    for (const status of ORDER_STATUSES) {
      expect(isDispatchOrderTab(status)).toBe(true);
    }
    expect(isDispatchOrderTab("archived")).toBe(false);
    expect(isDispatchOrderTab("")).toBe(false);
    expect(isDispatchOrderTab(undefined)).toBe(false);
  });
});
