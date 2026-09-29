// Looping product carousel helpers: the track holds the real slides plus
// one trailing clone of slide 0, so autoplay always advances right-to-left
// and the wrap back to the start is an invisible instant jump.
import { describe, expect, test } from "bun:test";
import {
  CAROUSEL_AUTOPLAY_MS,
  isCloneSlide,
  nextSlidePosition,
  slideIndexAt,
  slidePosition,
  withLoopClone,
} from "@/components/products/carousel-utils";

describe("slidePosition", () => {
  test("rounds the scroll offset to the nearest slide", () => {
    expect(slidePosition(0, 400)).toBe(0);
    expect(slidePosition(190, 400)).toBe(0);
    expect(slidePosition(210, 400)).toBe(1);
    expect(slidePosition(1200, 400)).toBe(3);
  });

  test("guards against zero width and bad numbers", () => {
    expect(slidePosition(500, 0)).toBe(0);
    expect(slidePosition(Number.NaN, 400)).toBe(0);
    expect(slidePosition(-50, 400)).toBe(0);
  });
});

describe("slideIndexAt", () => {
  test("maps the trailing clone back to slide 0", () => {
    expect(slideIndexAt(0, 4)).toBe(0);
    expect(slideIndexAt(3, 4)).toBe(3);
    expect(slideIndexAt(4, 4)).toBe(0);
  });

  test("handles empty and negative positions", () => {
    expect(slideIndexAt(2, 0)).toBe(0);
    expect(slideIndexAt(-1, 4)).toBe(3);
  });
});

describe("isCloneSlide", () => {
  test("only the position past the last real slide is the clone", () => {
    expect(isCloneSlide(3, 4)).toBe(false);
    expect(isCloneSlide(4, 4)).toBe(true);
  });

  test("a single image never loops", () => {
    expect(isCloneSlide(1, 1)).toBe(false);
    expect(isCloneSlide(0, 0)).toBe(false);
  });
});

describe("nextSlidePosition", () => {
  test("always steps forward and stops on the clone", () => {
    expect(nextSlidePosition(0, 4)).toBe(1);
    expect(nextSlidePosition(3, 4)).toBe(4);
    expect(nextSlidePosition(4, 4)).toBe(4);
  });

  test("a single slide stays put", () => {
    expect(nextSlidePosition(0, 1)).toBe(0);
    expect(nextSlidePosition(0, 0)).toBe(0);
  });
});

describe("withLoopClone", () => {
  test("appends a copy of the first slide when there are several", () => {
    expect(withLoopClone(["a", "b", "c"])).toEqual(["a", "b", "c", "a"]);
  });

  test("leaves one or zero slides untouched", () => {
    expect(withLoopClone(["a"])).toEqual(["a"]);
    expect(withLoopClone([])).toEqual([]);
  });

  test("does not mutate the source list", () => {
    const source = ["a", "b"];
    withLoopClone(source);
    expect(source).toEqual(["a", "b"]);
  });
});

describe("autoplay interval", () => {
  test("is slow enough to read and finite", () => {
    expect(CAROUSEL_AUTOPLAY_MS).toBeGreaterThanOrEqual(3000);
    expect(Number.isFinite(CAROUSEL_AUTOPLAY_MS)).toBe(true);
  });
});
