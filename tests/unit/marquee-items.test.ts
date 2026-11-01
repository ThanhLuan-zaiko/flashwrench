import { describe, expect, test } from "bun:test";
import {
  MARQUEE_DRIFT_MIN,
  marqueeRow,
  shouldDrift,
} from "@/components/home/marquee-items";

describe("shouldDrift", () => {
  test("keeps short lists static and drifts from the threshold up", () => {
    expect(MARQUEE_DRIFT_MIN).toBe(4);
    expect(shouldDrift(0)).toBe(false);
    expect(shouldDrift(1)).toBe(false);
    expect(shouldDrift(3)).toBe(false);
    expect(shouldDrift(4)).toBe(true);
    expect(shouldDrift(2, 2)).toBe(true);
  });
});

describe("marqueeRow", () => {
  test("keeps a long list as one copy in order", () => {
    const items = [
      { id: "a" },
      { id: "b" },
      { id: "c" },
      { id: "d" },
      { id: "e" },
      { id: "f" },
      { id: "g" },
    ];
    expect(marqueeRow(items).map((entry) => entry.item.id)).toEqual(
      items.map((item) => item.id),
    );
  });

  test("repeats a short list until one copy has enough items", () => {
    const row = marqueeRow([{ id: "a" }, { id: "b" }]);
    expect(row).toHaveLength(6);
    expect(row.map((entry) => entry.item.id)).toEqual([
      "a",
      "b",
      "a",
      "b",
      "a",
      "b",
    ]);
  });

  test("gives every entry in a copy a unique key", () => {
    const keys = marqueeRow([{ id: "a" }]).map((entry) => entry.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  test("returns nothing for an empty list", () => {
    expect(marqueeRow([])).toEqual([]);
  });
});
