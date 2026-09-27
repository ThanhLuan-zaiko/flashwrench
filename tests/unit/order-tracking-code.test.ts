// Shop-issued tracking code: deterministic per order, compact, and
// inside the courier-service length bounds.
import { describe, expect, test } from "bun:test";
import { generateTrackingCode } from "@/lib/orders/tracking-code";

describe("generateTrackingCode", () => {
  const ORDER_ID = "a2283121-4abc-4def-9abc-1234567890ab";

  test("formats FW-<8 hex> derived from the order id", () => {
    expect(generateTrackingCode(ORDER_ID)).toBe("FW-A2283121");
    expect(generateTrackingCode(ORDER_ID)).toMatch(/^FW-[0-9A-F]{8}$/);
  });

  test("is stable across calls and unique per order", () => {
    expect(generateTrackingCode(ORDER_ID)).toBe(generateTrackingCode(ORDER_ID));
    expect(generateTrackingCode(ORDER_ID)).not.toBe(
      generateTrackingCode("bbbbbbbb-0000-4000-8000-000000000000"),
    );
  });
});
