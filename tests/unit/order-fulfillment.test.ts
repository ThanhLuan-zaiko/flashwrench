// Fulfillment/courier guards + pricing + input validation for the parts
// order domain: pickup vs delivery transitions, the shipping-fee rule,
// and field-level checkout/POS validation.
import { describe, expect, test } from "bun:test";
import { validateCheckoutInput } from "@/lib/orders/checkout.service";
import { validateCounterSaleLines } from "@/lib/orders/order-lines.service";
import {
  FREE_SHIPPING_THRESHOLD,
  ORDER_SHIPPING_FEE,
  orderShippingFee,
} from "@/lib/orders/order-pricing";
import {
  canTransitionForOrder,
  isCourierType,
  isFulfillmentType,
  orderTransitions,
} from "@/lib/orders/orders.types";

function checkout(overrides = {}) {
  return {
    recipientName: "Nguyen Van A",
    phone: "0901234567",
    fulfillment: "delivery",
    address: "123 Duong ABC, Phuong Ben Nghe, Quan 1",
    addressLat: 10.7626,
    addressLng: 106.6601,
    province: "Ho Chi Minh",
    district: "Quan 1",
    ward: "Phuong Ben Nghe",
    street: "123 Duong ABC",
    ...overrides,
  };
}

describe("fulfillment-aware transitions", () => {
  test("pickup orders hand straight from packing to delivered", () => {
    expect(canTransitionForOrder("packing", "delivered", "pickup")).toBe(true);
    expect(canTransitionForOrder("packing", "shipping", "pickup")).toBe(false);
    expect(canTransitionForOrder("packing", "shipping", "delivery")).toBe(true);
    expect(canTransitionForOrder("packing", "delivered", "delivery")).toBe(
      false,
    );
  });

  test("pickup keeps the rest of the staff chain", () => {
    const pickup = orderTransitions("pickup");
    expect(pickup.pending).toEqual(["confirmed", "cancelled"]);
    expect(pickup.confirmed).toEqual(["packing", "cancelled"]);
    expect(pickup.shipping).toEqual(["delivered"]);
    expect(pickup.delivered).toEqual(["refunded"]);
  });

  test("type guards accept only known values", () => {
    expect(isFulfillmentType("delivery")).toBe(true);
    expect(isFulfillmentType("pickup")).toBe(true);
    expect(isFulfillmentType("ship")).toBe(false);
    expect(isCourierType("mechanic")).toBe(true);
    expect(isCourierType("third_party")).toBe(true);
    expect(isCourierType("grab")).toBe(false);
  });
});

describe("orderShippingFee", () => {
  test("pickup is always free", () => {
    expect(orderShippingFee("pickup", 0)).toBe(0);
    expect(orderShippingFee("pickup", 100_000)).toBe(0);
  });

  test("delivery charges the flat fee below the threshold", () => {
    expect(orderShippingFee("delivery", 0)).toBe(ORDER_SHIPPING_FEE);
    expect(orderShippingFee("delivery", FREE_SHIPPING_THRESHOLD - 1)).toBe(
      ORDER_SHIPPING_FEE,
    );
  });

  test("delivery is free at or above the threshold", () => {
    expect(orderShippingFee("delivery", FREE_SHIPPING_THRESHOLD)).toBe(0);
    expect(orderShippingFee("delivery", FREE_SHIPPING_THRESHOLD + 1)).toBe(0);
  });
});

describe("validateCheckoutInput", () => {
  test("accepts a complete delivery input", () => {
    expect(validateCheckoutInput(checkout())).toBeNull();
  });

  test("delivery requires an address and a map pin", () => {
    expect(validateCheckoutInput(checkout({ address: "" }))?.address).toBe(
      "Vui lòng nhập địa chỉ nhận hàng.",
    );
    const missingPin = validateCheckoutInput(
      checkout({ addressLat: null, addressLng: null }),
    );
    expect(missingPin?.address).toContain("ghim vị trí");
    const badPin = validateCheckoutInput(checkout({ addressLat: 91 }));
    expect(badPin?.address).toContain("ghim vị trí");
  });

  test("pickup needs neither address nor coordinates", () => {
    const errors = validateCheckoutInput(
      checkout({
        fulfillment: "pickup",
        address: "",
        addressLat: null,
        addressLng: null,
      }),
    );
    expect(errors).toBeNull();
  });

  test("rejects an unknown fulfillment value", () => {
    const errors = validateCheckoutInput(checkout({ fulfillment: "drone" }));
    expect(errors?.fulfillment).toBeTruthy();
  });

  test("still validates recipient, phone and note for both modes", () => {
    expect(
      validateCheckoutInput(checkout({ recipientName: "x" }))?.recipientName,
    ).toBeTruthy();
    expect(
      validateCheckoutInput(checkout({ phone: "abc" }))?.phone,
    ).toBeTruthy();
    const longNote = "n".repeat(501);
    expect(
      validateCheckoutInput(checkout({ fulfillment: "pickup", note: longNote }))
        ?.note,
    ).toBeTruthy();
  });
});

describe("validateCounterSaleLines", () => {
  const line = { partId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", quantity: 1 };

  test("rejects empty or missing line lists", () => {
    expect(validateCounterSaleLines(undefined)?.lines).toBeTruthy();
    expect(validateCounterSaleLines([])?.lines).toBeTruthy();
  });

  test("caps a sale at 20 lines", () => {
    const lines = Array.from({ length: 21 }, () => ({ ...line }));
    expect(validateCounterSaleLines(lines)?.lines).toContain("20");
  });

  test("rejects bad part ids and out-of-range quantities", () => {
    expect(
      validateCounterSaleLines([{ partId: "", quantity: 1 }])?.lines,
    ).toBeTruthy();
    expect(
      validateCounterSaleLines([{ partId: line.partId, quantity: 0 }])?.lines,
    ).toBeTruthy();
    expect(
      validateCounterSaleLines([{ partId: line.partId, quantity: 100 }])?.lines,
    ).toBeTruthy();
    expect(
      validateCounterSaleLines([{ partId: line.partId, quantity: 1.5 }])?.lines,
    ).toBeTruthy();
  });

  test("accepts a sane line list", () => {
    expect(
      validateCounterSaleLines([line, { ...line, quantity: 99 }]),
    ).toBeNull();
  });
});
