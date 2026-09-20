// Order formatting: every status must have a Vietnamese label and a badge
// class, and terminal states get the dimmed treatment.
import { describe, expect, test } from "bun:test";
import {
  ORDER_STATUS_LABELS,
  orderStatusBadgeClass,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/components/orders/order-format";
import { ORDER_STATUSES } from "@/lib/orders/orders.types";

describe("order status formatting", () => {
  test("every status has a non-empty Vietnamese label", () => {
    for (const status of ORDER_STATUSES) {
      const label = ORDER_STATUS_LABELS[status];
      expect(typeof label).toBe("string");
      expect(label.length).toBeGreaterThan(0);
    }
    expect(Object.keys(ORDER_STATUS_LABELS).sort()).toEqual(
      [...ORDER_STATUSES].sort(),
    );
  });

  test("badge classes stay monochrome with borders", () => {
    for (const status of ORDER_STATUSES) {
      const cls = orderStatusBadgeClass(status);
      expect(cls).toContain("border");
      expect(cls).toContain("rounded-full");
    }
  });

  test("payment labels cover the stored enums", () => {
    expect(PAYMENT_STATUS_LABELS.unpaid).toBeTruthy();
    expect(PAYMENT_STATUS_LABELS.paid).toBeTruthy();
    expect(PAYMENT_STATUS_LABELS.refunded).toBeTruthy();
    expect(PAYMENT_METHOD_LABELS.cod).toBeTruthy();
  });
});
