import { describe, expect, test } from "bun:test";
import { priceRangeOf } from "@/lib/home/price-terms";
import { makeServiceItem } from "../helpers/catalog.fixtures";

describe("priceRangeOf", () => {
  test("spans the lowest and highest live base price", () => {
    const range = priceRangeOf([
      makeServiceItem({ id: "a", basePrice: 300000 }),
      makeServiceItem({ id: "b", basePrice: 700000 }),
      makeServiceItem({ id: "c", basePrice: 450000 }),
    ]);
    expect(range).toEqual({ min: 300000, max: 700000 });
  });

  test("ignores inactive, deleted and unpriced services", () => {
    const range = priceRangeOf([
      makeServiceItem({ id: "off", basePrice: 50000, isActive: false }),
      makeServiceItem({ id: "gone", basePrice: 9000000, isDeleted: true }),
      makeServiceItem({ id: "free", basePrice: 0 }),
      makeServiceItem({ id: "ok", basePrice: 200000 }),
    ]);
    expect(range).toEqual({ min: 200000, max: 200000 });
  });

  test("returns null when no live service has a price", () => {
    expect(priceRangeOf([])).toBeNull();
    expect(priceRangeOf([makeServiceItem({ basePrice: 0 })])).toBeNull();
  });
});
