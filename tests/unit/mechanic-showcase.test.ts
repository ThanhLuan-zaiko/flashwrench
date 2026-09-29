import { describe, expect, test } from "bun:test";
import type { ShowcaseMechanicRow } from "@/lib/home/mechanic-showcase.repository";
import {
  SHOWCASE_NAME_FALLBACK,
  selectShowcaseMechanics,
} from "@/lib/home/mechanic-showcase.service";

function makeRow(
  mechanicId: string,
  overrides: Partial<ShowcaseMechanicRow> = {},
): ShowcaseMechanicRow {
  return {
    mechanic_id: mechanicId,
    display_name: `Thợ ${mechanicId}`,
    skills: ["engine"],
    is_verified: true,
    rating_avg: 4.5,
    rating_count: 10,
    completed_jobs: 20,
    ...overrides,
  };
}

describe("selectShowcaseMechanics", () => {
  test("drops unverified profiles", () => {
    const rows = [
      makeRow("a", { is_verified: true }),
      makeRow("b", { is_verified: false }),
      makeRow("c", { is_verified: null }),
    ];
    const picked = selectShowcaseMechanics(rows);
    expect(picked.map((item) => item.id)).toEqual(["a"]);
  });

  test("ranks rated mechanics above unrated ones", () => {
    const rows = [
      makeRow("unrated", { rating_avg: 0, rating_count: 0 }),
      makeRow("rated", { rating_avg: 3.5, rating_count: 2 }),
    ];
    const picked = selectShowcaseMechanics(rows);
    expect(picked[0]?.id).toBe("rated");
    expect(picked[1]?.id).toBe("unrated");
  });

  test("sorts by rating average then review count then completed jobs", () => {
    const rows = [
      makeRow("low-avg", { rating_avg: 4.2, rating_count: 50 }),
      makeRow("mid-avg", { rating_avg: 4.8, rating_count: 3 }),
      makeRow("high-avg", { rating_avg: 4.8, rating_count: 30 }),
    ];
    const picked = selectShowcaseMechanics(rows);
    expect(picked.map((item) => item.id)).toEqual([
      "high-avg",
      "mid-avg",
      "low-avg",
    ]);
  });

  test("caps the selection at the requested limit", () => {
    const rows = ["a", "b", "c", "d"].map((id, index) =>
      makeRow(id, { rating_avg: 4 + index / 10, rating_count: 5 }),
    );
    expect(selectShowcaseMechanics(rows, 2)).toHaveLength(2);
    expect(selectShowcaseMechanics(rows, 0)).toHaveLength(0);
  });

  test("normalizes names, skills and counters", () => {
    const rows = [
      makeRow("a", {
        display_name: "   ",
        skills: [" engine ", "", "  brake"],
        rating_avg: null,
        rating_count: null,
        completed_jobs: null,
      }),
    ];
    const [first] = selectShowcaseMechanics(rows);
    expect(first?.displayName).toBe(SHOWCASE_NAME_FALLBACK);
    expect(first?.skills).toEqual(["engine", "brake"]);
    expect(first?.ratingAvg).toBe(0);
    expect(first?.ratingCount).toBe(0);
    expect(first?.completedJobs).toBe(0);
  });
});
