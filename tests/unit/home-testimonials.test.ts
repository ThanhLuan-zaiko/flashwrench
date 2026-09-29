import { describe, expect, test } from "bun:test";
import {
  TESTIMONIAL_COUNT,
  TESTIMONIAL_HERO_INDEX,
  TESTIMONIAL_WIDE_INDEXES,
  TESTIMONIALS,
} from "@/components/home/testimonials/testimonials.data";

// The quote wall grid is hand-computed: one 2x2 hero, two wide and four
// compact cards fill lg:grid-cols-4 exactly. These guards keep the data
// in step with the layout.
describe("TESTIMONIALS", () => {
  test("ships exactly the number of cards the grid expects", () => {
    expect(TESTIMONIALS).toHaveLength(TESTIMONIAL_COUNT);
  });

  test("has unique ids", () => {
    const ids = TESTIMONIALS.map((testimonial) => testimonial.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("keeps hero and wide indexes distinct and in range", () => {
    expect(TESTIMONIAL_WIDE_INDEXES).not.toContain(TESTIMONIAL_HERO_INDEX);
    for (const index of TESTIMONIAL_WIDE_INDEXES) {
      expect(index).toBeGreaterThan(0);
      expect(index).toBeLessThan(TESTIMONIAL_COUNT);
    }
    expect(new Set(TESTIMONIAL_WIDE_INDEXES).size).toBe(
      TESTIMONIAL_WIDE_INDEXES.length,
    );
  });

  test("every quote is a complete positive review", () => {
    for (const testimonial of TESTIMONIALS) {
      expect(testimonial.customerName.trim().length).toBeGreaterThan(0);
      expect(testimonial.serviceLabel.trim().length).toBeGreaterThan(0);
      expect(testimonial.quote.trim().length).toBeGreaterThan(20);
      expect(testimonial.rating).toBeGreaterThanOrEqual(4);
      expect(testimonial.rating).toBeLessThanOrEqual(5);
    }
  });
});
