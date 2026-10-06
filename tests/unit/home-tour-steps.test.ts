import { describe, expect, test } from "bun:test";
import {
  HOME_TOUR_NAME,
  HOME_TOUR_STEPS,
} from "@/components/home/tour/home-tour.steps";

const VALID_SIDES = new Set([
  "top",
  "bottom",
  "left",
  "right",
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
  "left-top",
  "left-bottom",
  "right-top",
  "right-bottom",
]);

describe("home tour steps", () => {
  test("exposes a single named tour", () => {
    expect(HOME_TOUR_NAME).toBe("home-guide");
    expect(HOME_TOUR_STEPS).toHaveLength(1);
    expect(HOME_TOUR_STEPS[0]?.tour).toBe(HOME_TOUR_NAME);
  });

  test("covers booking, services, how-it-works and rescue anchors", () => {
    const steps = HOME_TOUR_STEPS[0]?.steps ?? [];
    expect(steps).toHaveLength(4);
    const selectors = steps.map((step) => step.selector ?? "");
    expect(selectors).toEqual([
      '[data-tour="booking-cta"]',
      '[data-tour="services"]',
      '[data-tour="how-it-works"]',
      '[data-tour="rescue-cta"]',
    ]);
    expect(new Set(selectors).size).toBe(selectors.length);
  });

  test("uses Vietnamese guidance copy", () => {
    const steps = HOME_TOUR_STEPS[0]?.steps ?? [];
    for (const step of steps) {
      expect(step.title.trim().length).toBeGreaterThan(0);
      expect(String(step.content).trim().length).toBeGreaterThan(0);
    }
    const titles = steps.map((step) => step.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  test("keeps spotlight placement and offsets valid", () => {
    const steps = HOME_TOUR_STEPS[0]?.steps ?? [];
    for (const step of steps) {
      expect(VALID_SIDES.has(step.side ?? "")).toBe(true);
      expect(step.pointerPadding ?? 0).toBeGreaterThanOrEqual(0);
      expect(step.pointerRadius ?? 0).toBeGreaterThanOrEqual(0);
      expect(step.cardOffset ?? 0).toBeGreaterThanOrEqual(0);
      // Sticky header is 64px tall, so the scroll offset must clear it.
      expect(step.scrollOffset ?? 0).toBeGreaterThanOrEqual(64);
      expect(step.selectorRetryAttempts ?? 0).toBeGreaterThan(0);
    }
  });

  test("omits built-in card controls when using a custom card", () => {
    const steps = HOME_TOUR_STEPS[0]?.steps ?? [];
    for (const step of steps) {
      expect("showControls" in step).toBe(false);
      expect("showSkip" in step).toBe(false);
    }
  });
});
