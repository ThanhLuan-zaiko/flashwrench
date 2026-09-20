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

  test("refund is the only admin-only target, cancel the only restock", () => {
    expect(requiresAdminTransition("refunded")).toBe(true);
    expect(requiresAdminTransition("delivered")).toBe(false);
    expect(ADMIN_ONLY_TRANSITIONS).toEqual(["refunded"]);
    expect(RESTOCK_TRANSITIONS).toEqual(["cancelled"]);
  });
});
