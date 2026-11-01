import { describe, expect, test } from "bun:test";
import {
  CART_SUGGESTION_LIMIT,
  pickCartSuggestions,
} from "@/components/cart/cart-suggestions";
import { makePartItem } from "../helpers/home-catalog.fixtures";

describe("pickCartSuggestions", () => {
  test("keeps only live, in-stock parts", () => {
    const picked = pickCartSuggestions([
      makePartItem({ id: "sold-out", stockQty: 0 }),
      makePartItem({ id: "off", isActive: false }),
      makePartItem({ id: "gone", isDeleted: true }),
      makePartItem({ id: "ok" }),
    ]);
    expect(picked.map((part) => part.id)).toEqual(["ok"]);
  });

  test("puts photographed parts first, then best sellers", () => {
    const picked = pickCartSuggestions([
      makePartItem({ id: "few", soldCount: 2 }),
      makePartItem({ id: "no-photo", imageUrl: "", soldCount: 500 }),
      makePartItem({ id: "many", soldCount: 90 }),
    ]);
    expect(picked.map((part) => part.id)).toEqual(["many", "few", "no-photo"]);
  });

  test("caps the list at the limit", () => {
    const parts = [1, 2, 3, 4, 5, 6].map((n) => makePartItem({ id: `p${n}` }));
    expect(CART_SUGGESTION_LIMIT).toBe(4);
    expect(pickCartSuggestions(parts)).toHaveLength(4);
    expect(pickCartSuggestions(parts, 0)).toHaveLength(0);
  });
});
