// Guards the AGENTS.md brand rules baked into the shared class strings.
import { describe, expect, test } from "bun:test";
import * as brand from "@/components/ui/brand";

const all: Array<[string, string]> = Object.entries(brand).map(
  ([name, value]) => [name, String(value)],
);

describe("brand class strings", () => {
  test("the primary action is blue in both themes", () => {
    expect(brand.BRAND_PRIMARY_BUTTON).toContain("bg-[#1D4ED8]");
    expect(brand.BRAND_PRIMARY_BUTTON).toContain("text-white");
    expect(brand.BRAND_PRIMARY_BUTTON).toContain("dark:bg-[#60A5FA]");
    expect(brand.BRAND_PRIMARY_BUTTON).toContain("dark:text-[#111111]");
  });

  test("the brand fill never carries the primary action in light", () => {
    expect(brand.BRAND_PRIMARY_BUTTON).not.toMatch(/(^|\s)bg-\[#FB923C\]/);
  });

  test("blue carries solid buttons, orange carries active chips", () => {
    expect(brand.BRAND_SOLID_BUTTON).toContain("bg-[#1D4ED8]");
    expect(brand.BRAND_SOLID_BUTTON).toContain("text-white");
    expect(brand.BRAND_CHIP_ACTIVE).toContain("bg-[#FB923C]");
    expect(brand.BRAND_EYEBROW).toContain("text-[#111111]");
  });

  test("orange is never used as text on the white surface", () => {
    for (const [, value] of all) {
      expect(value).not.toMatch(/(^|\s)text-\[#FB923C\]/);
    }
  });

  test("no shared string adds a box shadow", () => {
    for (const [, value] of all) {
      expect(value).not.toMatch(/\bshadow-/);
    }
  });

  test("every interactive string keeps a dark-mode variant", () => {
    for (const value of [
      brand.BRAND_SOLID_BUTTON,
      brand.BRAND_OUTLINE_BUTTON,
      brand.BRAND_CHIP_ACTIVE,
      brand.BRAND_CHIP_IDLE,
    ]) {
      expect(value).toContain("dark:");
    }
  });
});
