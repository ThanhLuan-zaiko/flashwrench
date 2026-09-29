// "Thợ được đánh giá cao" ordering on the booking page: rated mechanics
// first, best average on top, deterministic tie-breaks.
import { describe, expect, test } from "bun:test";
import {
  rankTopMechanics,
  TOP_MECHANICS_LIMIT,
} from "@/components/booking/mechanic-ranking";
import type { MechanicDirectoryItem } from "@/lib/mechanic/mechanic-directory.service";

function makeMechanic(
  id: string,
  overrides?: Partial<MechanicDirectoryItem>,
): MechanicDirectoryItem {
  return {
    id,
    displayName: `Tho ${id}`,
    skills: [],
    ratingAvg: 0,
    ratingCount: 0,
    completedJobs: 0,
    isOnline: true,
    lat: null,
    lng: null,
    distanceKm: null,
    ...overrides,
  };
}

const ids = (items: MechanicDirectoryItem[]) => items.map((item) => item.id);

describe("rankTopMechanics", () => {
  test("orders by average rating, best first", () => {
    const ranked = rankTopMechanics([
      makeMechanic("a", { ratingAvg: 4.2, ratingCount: 5 }),
      makeMechanic("b", { ratingAvg: 4.9, ratingCount: 5 }),
      makeMechanic("c", { ratingAvg: 4.5, ratingCount: 5 }),
    ]);
    expect(ids(ranked)).toEqual(["b", "c", "a"]);
  });

  test("mechanics with reviews always outrank unrated ones", () => {
    const ranked = rankTopMechanics([
      makeMechanic("unrated", { ratingAvg: 5, ratingCount: 0 }),
      makeMechanic("rated", { ratingAvg: 3.1, ratingCount: 2 }),
    ]);
    expect(ids(ranked)).toEqual(["rated", "unrated"]);
  });

  test("ties fall back to review count, then completed jobs", () => {
    const ranked = rankTopMechanics([
      makeMechanic("few", { ratingAvg: 4.5, ratingCount: 2, completedJobs: 9 }),
      makeMechanic("many", {
        ratingAvg: 4.5,
        ratingCount: 8,
        completedJobs: 1,
      }),
      makeMechanic("busy", {
        ratingAvg: 4.5,
        ratingCount: 2,
        completedJobs: 30,
      }),
    ]);
    expect(ids(ranked)).toEqual(["many", "busy", "few"]);
  });

  test("keeps only the top few and does not mutate the input", () => {
    const source = Array.from({ length: 6 }, (_, index) =>
      makeMechanic(`m${index}`, { ratingAvg: index, ratingCount: 1 }),
    );
    const before = ids(source);
    const ranked = rankTopMechanics(source);
    expect(ranked).toHaveLength(TOP_MECHANICS_LIMIT);
    expect(ids(ranked)).toEqual(["m5", "m4", "m3"]);
    expect(ids(source)).toEqual(before);
    expect(rankTopMechanics(source, 1)).toHaveLength(1);
    expect(rankTopMechanics(source, 0)).toEqual([]);
  });

  test("an empty directory ranks to an empty list", () => {
    expect(rankTopMechanics([])).toEqual([]);
  });
});
