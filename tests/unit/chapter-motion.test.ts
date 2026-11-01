import { describe, expect, test } from "bun:test";
import {
  CHAPTER_LINES,
  CHAPTER_PARALLAX,
  CHAPTER_PHOTO_CLIP,
  CHAPTER_ROW,
  CHAPTER_RULE,
  formatCountValue,
  marqueeDuration,
  marqueeOffsets,
  nextSlideIndex,
} from "@/lib/motion/chapter-motion";

describe("chapter motion values", () => {
  test("headline lines rise from below their mask to rest", () => {
    expect(CHAPTER_LINES.from.yPercent).toBeGreaterThan(100);
    expect(CHAPTER_LINES.to.yPercent).toBe(0);
  });

  test("one-shot tweens respect the 0.6s cap and power2.out ease", () => {
    for (const { to } of [
      CHAPTER_LINES,
      CHAPTER_RULE,
      CHAPTER_ROW,
      CHAPTER_PHOTO_CLIP,
    ]) {
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

describe("parallax values", () => {
  test("the parallax scale leaves spare room for the full drift", () => {
    const spare = ((CHAPTER_PARALLAX.scale - 1) / 2) * 100;
    expect(CHAPTER_PARALLAX.shiftPercent).toBeLessThan(spare);
  });
});

describe("marqueeOffsets", () => {
  test("a left marquee moves content from right to left", () => {
    expect(marqueeOffsets("left", 600)).toEqual({ from: 0, to: -600 });
  });

  test("a right marquee moves content from left to right", () => {
    expect(marqueeOffsets("right", 600)).toEqual({ from: -600, to: 0 });
  });
});

describe("marqueeDuration", () => {
  test("takes one second per 60px of travel", () => {
    expect(marqueeDuration(600)).toBe(10);
  });

  test("a longer track takes longer for one loop", () => {
    expect(marqueeDuration(1200)).toBeGreaterThan(marqueeDuration(600));
  });
});

describe("nextSlideIndex", () => {
  test("advances one slide at a time", () => {
    expect(nextSlideIndex(0, 3)).toBe(1);
    expect(nextSlideIndex(1, 3)).toBe(2);
  });

  test("wraps back to the first slide after the last", () => {
    expect(nextSlideIndex(2, 3)).toBe(0);
  });

  test("stays at zero when there is nothing to show", () => {
    expect(nextSlideIndex(0, 0)).toBe(0);
  });
});

describe("formatCountValue", () => {
  test("matches the static Vietnamese price format", () => {
    expect(formatCountValue(700000)).toBe("700.000đ");
    expect(formatCountValue(0)).toBe("0đ");
  });
});
