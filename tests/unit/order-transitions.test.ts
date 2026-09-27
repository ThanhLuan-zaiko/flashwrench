// Order status state machine: only the documented staff transitions are
// legal, terminals are frozen, and refunds are admin-only targets.
import { describe, expect, test } from "bun:test";
import {
  ADMIN_ONLY_TRANSITIONS,
  canTransition,
  isOrderStatus,
  ORDER_STATUSES,
  RESTOCK_TRANSITIONS,
  requiresAdminTransition,
  STAFF_ORDER_TRANSITIONS,
} from "@/lib/orders/orders.types";

describe("order status guards", () => {
  test("recognizes exactly the seven order statuses", () => {
    for (const status of ORDER_STATUSES) {
      expect(isOrderStatus(status)).toBe(true);
    }
    expect(isOrderStatus("archived")).toBe(false);
    expect(isOrderStatus("")).toBe(false);
    expect(isOrderStatus(null)).toBe(false);
    expect(isOrderStatus(42)).toBe(false);
  });

  test("allows the documented happy-path chain", () => {
    expect(canTransition("pending", "confirmed")).toBe(true);
    expect(canTransition("confirmed", "packing")).toBe(true);
    expect(canTransition("packing", "shipping")).toBe(true);
    expect(canTransition("shipping", "delivered")).toBe(true);
    expect(canTransition("delivered", "refunded")).toBe(true);
  });

  test("return requests resolve to refunded or back to delivered", () => {
    expect(canTransition("return_requested", "refunded")).toBe(true);
    expect(canTransition("return_requested", "delivered")).toBe(true);
    expect(canTransition("return_requested", "cancelled")).toBe(false);
    expect(canTransition("return_requested", "shipping")).toBe(false);
    // Customers reach return_requested through their own action, not the
    // staff transition table.
    expect(canTransition("delivered", "return_requested")).toBe(false);
  });

  test("allows staff cancellation before shipping", () => {
    expect(canTransition("pending", "cancelled")).toBe(true);
    expect(canTransition("confirmed", "cancelled")).toBe(true);
    expect(canTransition("packing", "cancelled")).toBe(true);
    expect(canTransition("shipping", "cancelled")).toBe(false);
    expect(canTransition("delivered", "cancelled")).toBe(false);
  });

  test("blocks skips, regressions and self-transitions", () => {
    expect(canTransition("pending", "packing")).toBe(false);
    expect(canTransition("pending", "delivered")).toBe(false);
    expect(canTransition("confirmed", "pending")).toBe(false);
    expect(canTransition("shipping", "packing")).toBe(false);
    for (const status of ORDER_STATUSES) {
      expect(canTransition(status, status)).toBe(false);
    }
  });

  test("terminal states cannot leave", () => {
    expect(STAFF_ORDER_TRANSITIONS.cancelled).toEqual([]);
    expect(STAFF_ORDER_TRANSITIONS.refunded).toEqual([]);
    for (const target of ORDER_STATUSES) {
      expect(canTransition("cancelled", target)).toBe(false);
      expect(canTransition("refunded", target)).toBe(false);
    }
  });

  test("direct refund is admin-only, request approval is not", () => {
    expect(requiresAdminTransition("delivered", "refunded")).toBe(true);
    expect(requiresAdminTransition("return_requested", "refunded")).toBe(false);
    expect(requiresAdminTransition("return_requested", "delivered")).toBe(
      false,
    );
    expect(ADMIN_ONLY_TRANSITIONS).toEqual([["delivered", "refunded"]]);
    expect(RESTOCK_TRANSITIONS).toEqual(["cancelled"]);
  });
});
