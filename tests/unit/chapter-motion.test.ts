import { describe, expect, test } from "bun:test";
import {
  CHAPTER_FOCUS_MIN_OPACITY,
  CHAPTER_LINES,
  CHAPTER_PARALLAX,
  CHAPTER_PHOTO_CLIP,
  CHAPTER_PREVIEW,
  CHAPTER_ROW,
  CHAPTER_RULE,
  formatCountValue,
  previewPosition,
} from "@/lib/motion/chapter-motion";

describe("chapter motion values", () => {
  test("headline lines rise from below their mask to rest", () => {
    expect(CHAPTER_LINES.from.yPercent).toBeGreaterThan(100);
    expect(CHAPTER_LINES.to.yPercent).toBe(0);
  });

  test("one-shot tweens respect the 0.6s cap and power2.out ease", () => {
    for (const { to } of [CHAPTER_LINES, CHAPTER_RULE, CHAPTER_ROW]) {
      expect(to.duration).toBeLessThanOrEqual(0.6);
      expect(to.ease).toBe("power2.out");
    }
  });

  test("rules draw from zero to full width", () => {
    expect(CHAPTER_RULE.from.scaleX).toBe(0);
    expect(CHAPTER_RULE.to.scaleX).toBe(1);
  });

  test("rows end fully visible and in place", () => {
    expect(CHAPTER_ROW.to).toMatchObject({ y: 0, opacity: 1 });
  });

  test("photos open from fully clipped to fully visible", () => {
    expect(CHAPTER_PHOTO_CLIP.from.clipPath).toBe("inset(0% 0% 100% 0%)");
    expect(CHAPTER_PHOTO_CLIP.to.clipPath).toBe("inset(0% 0% 0% 0%)");
  });
});

describe("parallax and focus values", () => {
  test("the parallax scale leaves spare room for the full drift", () => {
    const spare = ((CHAPTER_PARALLAX.scale - 1) / 2) * 100;
    expect(CHAPTER_PARALLAX.shiftPercent).toBeLessThan(spare);
  });

  test("dimmed titles stay readable", () => {
    expect(CHAPTER_FOCUS_MIN_OPACITY).toBeGreaterThanOrEqual(0.5);
    expect(CHAPTER_FOCUS_MIN_OPACITY).toBeLessThan(1);
  });
});

describe("formatCountValue", () => {
  test("matches the static Vietnamese price format", () => {
    expect(formatCountValue(700000)).toBe("700.000đ");
    expect(formatCountValue(0)).toBe("0đ");
  });
});

describe("previewPosition", () => {
  const { width, height, gap, edge } = CHAPTER_PREVIEW;

  test("sits to the right of the pointer when there is room", () => {
    const { x } = previewPosition(200, 400, 1440, 900);
    expect(x).toBe(200 + gap);
  });

  test("flips to the left near the right edge", () => {
    const { x } = previewPosition(1400, 400, 1440, 900);
    expect(x).toBe(1400 - gap - width);
  });

  test("centres on the pointer vertically", () => {
    expect(previewPosition(200, 400, 1440, 900).y).toBe(400 - height / 2);
  });

  test("clamps to the viewport top and bottom", () => {
    expect(previewPosition(200, 0, 1440, 900).y).toBe(edge);
    expect(previewPosition(200, 900, 1440, 900).y).toBe(900 - height - edge);
  });
});
