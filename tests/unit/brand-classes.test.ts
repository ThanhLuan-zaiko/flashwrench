// Guards the AGENTS.md brand rules baked into the shared class strings.
import { describe, expect, test } from "bun:test";
import * as brand from "@/components/ui/brand";

const all: Array<[string, string]> = Object.entries(brand).map(
  ([name, value]) => [name, String(value)],
);

describe("brand class strings", () => {
  test("the primary action is black in light and white in dark", () => {
    expect(brand.BRAND_PRIMARY_BUTTON).toContain("bg-[#111111]");
    expect(brand.BRAND_PRIMARY_BUTTON).toContain("text-white");
    expect(brand.BRAND_PRIMARY_BUTTON).toContain("dark:bg-zinc-100");
    expect(brand.BRAND_PRIMARY_BUTTON).toContain("dark:text-zinc-900");
  });

  test("yellow never carries the primary action", () => {
    expect(brand.BRAND_PRIMARY_BUTTON).not.toContain("#FACC15");
  });

  test("yellow carries solid buttons and active chips, black carries text", () => {
    expect(brand.BRAND_SOLID_BUTTON).toContain("bg-[#FACC15]");
    expect(brand.BRAND_SOLID_BUTTON).toContain("text-[#111111]");
    expect(brand.BRAND_CHIP_ACTIVE).toContain("bg-[#FACC15]");
    expect(brand.BRAND_EYEBROW).toContain("text-[#111111]");
  });

  test("yellow is never used as text on the white surface", () => {
    for (const [, value] of all) {
      expect(value).not.toMatch(/(^|\s)text-\[#FACC15\]/);
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
