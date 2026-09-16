// Option builder behind the filter pill auto-scroll. Pure module, so no
// mocks are needed anywhere in this file.
import { describe, expect, test } from "bun:test";
import {
  prefersReducedMotion,
  tabScrollOptions,
} from "@/app/mechanic/components/tab-scroll";

describe("tabScrollOptions", () => {
  test("smooth-centers the active pill for full-motion users", () => {
    expect(tabScrollOptions(false)).toEqual({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  });

  test("jumps instantly for reduced-motion users", () => {
    expect(tabScrollOptions(true)).toEqual({
      behavior: "auto",
      block: "nearest",
      inline: "center",
    });
  });
});

describe("prefersReducedMotion", () => {
  test("stays SSR-safe with no window", () => {
    expect(prefersReducedMotion()).toBe(true);
  });
});
