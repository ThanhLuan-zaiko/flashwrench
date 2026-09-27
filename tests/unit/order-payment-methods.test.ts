import { describe, expect, test } from "bun:test";
import {
  defaultPaymentMethodFor,
  isOrderPaymentMethod,
  ORDER_PAYMENT_METHODS,
  paymentMethodsFor,
  resolveOrderPaymentMethod,
} from "@/lib/payments/order-payment.types";

describe("order payment methods", () => {
  test("delivery offers cod, counter and the mock online gateway", () => {
    expect(paymentMethodsFor("delivery")).toEqual([
      "cod",
      "counter",
      "bank_transfer",
    ]);
  });

  test("pickup drops cod — paying a courier needs a courier", () => {
    expect(paymentMethodsFor("pickup")).toEqual(["counter", "bank_transfer"]);
  });

  test("defaults: cod for delivery, counter for pickup", () => {
    expect(defaultPaymentMethodFor("delivery")).toBe("cod");
    expect(defaultPaymentMethodFor("pickup")).toBe("counter");
  });

  test("isOrderPaymentMethod guards the known set", () => {
    for (const method of ORDER_PAYMENT_METHODS) {
      expect(isOrderPaymentMethod(method)).toBe(true);
    }
    expect(isOrderPaymentMethod("momo")).toBe(false);
    expect(isOrderPaymentMethod("")).toBe(false);
    expect(isOrderPaymentMethod(42)).toBe(false);
    expect(isOrderPaymentMethod(undefined)).toBe(false);
  });
});

describe("resolveOrderPaymentMethod", () => {
  test("empty input falls back to the fulfillment default", () => {
    expect(resolveOrderPaymentMethod("delivery", undefined)).toBe("cod");
    expect(resolveOrderPaymentMethod("delivery", "  ")).toBe("cod");
    expect(resolveOrderPaymentMethod("pickup", undefined)).toBe("counter");
  });

  test("accepts any offered method for the fulfillment", () => {
    expect(resolveOrderPaymentMethod("delivery", "counter")).toBe("counter");
    expect(resolveOrderPaymentMethod("delivery", "bank_transfer")).toBe(
      "bank_transfer",
    );
    expect(resolveOrderPaymentMethod("pickup", "bank_transfer")).toBe(
      "bank_transfer",
    );
  });

  test("rejects cod on pickup and unknown methods", () => {
    expect(resolveOrderPaymentMethod("pickup", "cod")).toBeNull();
    expect(resolveOrderPaymentMethod("delivery", "momo")).toBeNull();
    expect(resolveOrderPaymentMethod("pickup", "COD")).toBeNull();
  });
});
