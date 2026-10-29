// Guards the AGENTS.md brand rules baked into the shared class strings.
import { describe, expect, test } from "bun:test";
import * as brand from "@/components/ui/brand";

const all: Array<[string, string]> = Object.entries(brand).map(
  ([name, value]) => [name, String(value)],
);

describe("brand class strings", () => {
  test("the primary action is orange with the dark navy text", () => {
    expect(brand.BRAND_PRIMARY_BUTTON).toContain("bg-[#F97316]");
    expect(brand.BRAND_PRIMARY_BUTTON).toContain("text-[#0F1E33]");
    expect(brand.BRAND_PRIMARY_BUTTON).not.toContain("text-white");
  });

  test("orange appears only in the primary action", () => {
    const orange = all.filter(([, value]) => value.includes("#F97316"));
    expect(orange.map(([name]) => name)).toEqual(["BRAND_PRIMARY_BUTTON"]);
  });

  test("navy carries solid buttons, active chips and headings", () => {
    expect(brand.BRAND_SOLID_BUTTON).toContain("bg-[#1E3A5F]");
    expect(brand.BRAND_CHIP_ACTIVE).toContain("bg-[#1E3A5F]");
    expect(brand.BRAND_EYEBROW).toContain("text-[#1E3A5F]");
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
