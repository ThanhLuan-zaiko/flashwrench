import { describe, expect, test } from "bun:test";
import {
  PROMO_VISIBLE_LIMIT,
  promoWindowStart,
} from "@/components/promotions/promo-window";

describe("promoWindowStart", () => {
  test("shows the whole list when it fits the window", () => {
    expect(PROMO_VISIBLE_LIMIT).toBe(6);
    expect(promoWindowStart(6, 5)).toBe(0);
    expect(promoWindowStart(3, 2)).toBe(0);
  });

  test("keeps the open campaign inside the window", () => {
    for (let index = 0; index < 20; index++) {
      const start = promoWindowStart(20, index);
      expect(index).toBeGreaterThanOrEqual(start);
      expect(index).toBeLessThan(start + PROMO_VISIBLE_LIMIT);
    }
  });

  test("centres the window on the open campaign where possible", () => {
    expect(promoWindowStart(20, 10)).toBe(7);
  });

  test("clamps the window at both ends of the list", () => {
    expect(promoWindowStart(20, 0)).toBe(0);
    expect(promoWindowStart(20, 1)).toBe(0);
    expect(promoWindowStart(20, 19)).toBe(14);
  });
});
