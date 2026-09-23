import { describe, expect, test } from "bun:test";
import { shouldIgnoreLocatedPosition } from "@/components/booking/location-guards";

describe("shouldIgnoreLocatedPosition", () => {
  test("allows device location to replace coordinates prefetched from a booking", () => {
    expect(shouldIgnoreLocatedPosition(false, true)).toBe(false);
  });

  test("keeps a point explicitly selected by the customer", () => {
    expect(shouldIgnoreLocatedPosition(true, true)).toBe(true);
  });

  test("lets an explicit locate request replace a pinned point", () => {
    expect(shouldIgnoreLocatedPosition(true, false)).toBe(false);
  });
});
