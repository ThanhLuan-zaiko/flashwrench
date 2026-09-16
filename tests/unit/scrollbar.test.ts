// Guardrails for the shared scrollbar: pure Tailwind candidates only
// (no custom selectors), zinc monochrome, both themes covered. Pure
// module, so no mocks are needed anywhere in this file.
import { describe, expect, test } from "bun:test";
import { SCROLLBAR_CLASSES } from "@/components/ui/scrollbar";

const ZINC_HEXES = new Set(["a1a1aa", "71717a", "52525b"]);

describe("SCROLLBAR_CLASSES", () => {
  test("uses a thin native scrollbar", () => {
    expect(SCROLLBAR_CLASSES).toContain("[scrollbar-width:thin]");
  });

  test("keeps the track transparent with a monochrome thumb", () => {
    expect(SCROLLBAR_CLASSES).toContain("_transparent");
    const hexes = [...SCROLLBAR_CLASSES.matchAll(/#([0-9a-f]{6})/g)].map(
      (match) => match[1],
    );
    expect(hexes.length).toBeGreaterThan(0);
    for (const hex of hexes) {
      expect(ZINC_HEXES.has(hex)).toBe(true);
    }
  });

  test("covers hover and dark theme variants", () => {
    expect(SCROLLBAR_CLASSES).toContain("hover:[scrollbar-color:");
    expect(SCROLLBAR_CLASSES).toContain("dark:[scrollbar-color:");
    expect(SCROLLBAR_CLASSES).toContain("dark:hover:[scrollbar-color:");
  });

  test("stays custom-CSS free", () => {
    expect(SCROLLBAR_CLASSES).not.toContain("::-webkit");
    expect(SCROLLBAR_CLASSES).not.toContain("<style");
  });
});
