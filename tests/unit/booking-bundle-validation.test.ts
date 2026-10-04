import { describe, expect, test } from "bun:test";
import { validateCreateBookingInput } from "@/lib/booking/booking.validation";
import { makeBookingInput } from "../helpers/booking.fixtures";

const FIRST_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const SECOND_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

function bundleInput(serviceIds: string[]) {
  return makeBookingInput({ serviceId: undefined, serviceIds });
}

describe("multi-service booking input", () => {
  test("accepts and normalizes a list without a legacy service id", () => {
    const result = validateCreateBookingInput(
      bundleInput([` ${FIRST_ID.toUpperCase()} `, SECOND_ID]),
    );
    expect("value" in result).toBe(true);
    if (!("value" in result)) return;
    expect(result.value.serviceIds).toEqual([FIRST_ID, SECOND_ID]);
    expect(result.value.serviceId).toBe(FIRST_ID);
  });

  test("keeps the single-service input backwards compatible", () => {
    const result = validateCreateBookingInput(makeBookingInput());
    expect("value" in result).toBe(true);
    if (!("value" in result)) return;
    expect(result.value.serviceIds).toEqual([FIRST_ID]);
  });

  test("rejects duplicate services instead of charging twice", () => {
    const result = validateCreateBookingInput(
      bundleInput([FIRST_ID, FIRST_ID.toUpperCase()]),
    );
    expect("errors" in result).toBe(true);
    if (!("errors" in result)) return;
    expect(result.errors.serviceIds).toBeTruthy();
  });

  test("rejects empty, oversized and malformed service lists", () => {
    const oversized = Array.from(
      { length: 9 },
      (_, index) => `0000000${index}-bbbb-4bbb-8bbb-bbbbbbbbbbbb`,
    );
    for (const ids of [[], oversized, [FIRST_ID, "invalid"], [" "]]) {
      const result = validateCreateBookingInput(bundleInput(ids));
      expect("errors" in result).toBe(true);
      if ("errors" in result) expect(result.errors.serviceIds).toBeTruthy();
    }
    const result = validateCreateBookingInput(
      makeBookingInput({ serviceIds: "invalid" as unknown as string[] }),
    );
    expect("errors" in result).toBe(true);
  });

  test("rejects conflicting legacy and multi-service choices", () => {
    const result = validateCreateBookingInput(
      makeBookingInput({ serviceId: SECOND_ID, serviceIds: [FIRST_ID] }),
    );
    expect("errors" in result).toBe(true);
    if ("errors" in result) expect(result.errors.serviceIds).toBeTruthy();
  });

  test("rejects a malformed legacy id before a database lookup", () => {
    const result = validateCreateBookingInput(
      makeBookingInput({ serviceId: "invalid" }),
    );
    expect("errors" in result).toBe(true);
    if ("errors" in result) expect(result.errors.serviceId).toBeTruthy();
  });

  test("rejects malformed legacy fields even alongside a valid bundle", () => {
    for (const serviceId of [null, 12, {}, [FIRST_ID]]) {
      const result = validateCreateBookingInput(
        makeBookingInput({
          serviceId: serviceId as unknown as string,
          serviceIds: [FIRST_ID, SECOND_ID],
        }),
      );
      expect("errors" in result).toBe(true);
      if ("errors" in result) expect(result.errors.serviceId).toBeTruthy();
    }
  });

  test("accepts a quoted subtotal and rejects non-integer quotes", () => {
    const valid = validateCreateBookingInput(
      makeBookingInput({ expectedSubtotal: 300000 }),
    );
    expect("value" in valid).toBe(true);
    if ("value" in valid) expect(valid.value.expectedSubtotal).toBe(300000);
    for (const subtotal of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      const result = validateCreateBookingInput(
        makeBookingInput({ expectedSubtotal: subtotal }),
      );
      expect("errors" in result).toBe(true);
    }
  });
});
