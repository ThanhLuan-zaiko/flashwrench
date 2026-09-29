// Rating summaries for mechanic and service targets: only real 1-5 star
// ratings count and the average keeps one decimal.
import { describe, expect, test } from "bun:test";
import { summarizeRatings } from "@/lib/reviews/rating-summary";

describe("summarizeRatings", () => {
  test("averages valid ratings to one decimal", () => {
    expect(summarizeRatings([5, 4, 4])).toEqual({
      ratingAvg: 4.3,
      ratingCount: 3,
    });
    expect(summarizeRatings([5])).toEqual({ ratingAvg: 5, ratingCount: 1 });
  });

  test("drops zero, out-of-range and non-finite ratings", () => {
    expect(summarizeRatings([5, 0, 6, -1, Number.NaN, 3])).toEqual({
      ratingAvg: 4,
      ratingCount: 2,
    });
  });

  test("no valid ratings means an empty summary", () => {
    expect(summarizeRatings([])).toEqual({ ratingAvg: 0, ratingCount: 0 });
    expect(summarizeRatings([0, 0])).toEqual({ ratingAvg: 0, ratingCount: 0 });
  });
});
