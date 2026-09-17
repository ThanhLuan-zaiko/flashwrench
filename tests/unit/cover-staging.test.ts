import { describe, expect, test } from "bun:test";
import {
  buildGalleryPayload,
  canAddMore,
  decideStageFiles,
  displayNameFromUrl,
  MAX_COVER_IMAGES,
  moveToCover,
  removeAtIndex,
} from "@/app/admin/components/services/cover-staging";

const MB = 1024 * 1024;

function pick(name: string, type: string, size: number) {
  return { name, type, size };
}

describe("decideStageFiles", () => {
  test("accepts one or many valid images at once", () => {
    const decision = decideStageFiles(
      [
        pick("a.jpg", "image/jpeg", MB),
        pick("b.png", "image/png", 2 * MB),
        pick("c.webp", "image/webp", 3 * MB),
      ],
      0,
      8 * MB,
    );
    expect(decision.accepted.length).toBe(3);
    expect(decision.rejected).toEqual([]);
    expect(decision.limitHit).toBe(false);
  });

  test("rejects non-image mime and empty files", () => {
    const decision = decideStageFiles(
      [
        pick("evil.exe", "application/x-msdownload", MB),
        pick("empty.jpg", "image/jpeg", 0),
      ],
      0,
      8 * MB,
    );
    expect(decision.accepted).toEqual([]);
    expect(decision.rejected.map((r) => r.name)).toEqual([
      "evil.exe",
      "empty.jpg",
    ]);
  });

  test("rejects oversized files", () => {
    const decision = decideStageFiles(
      [pick("big.jpg", "image/jpeg", 9 * MB)],
      0,
      8 * MB,
    );
    expect(decision.accepted).toEqual([]);
    expect(decision.rejected[0]?.reason).toMatch("tối đa");
  });

  test("caps at the gallery max and flags the limit", () => {
    expect(MAX_COVER_IMAGES).toBe(5);
    const decision = decideStageFiles(
      [
        pick("1.jpg", "image/jpeg", MB),
        pick("2.jpg", "image/jpeg", MB),
        pick("3.jpg", "image/jpeg", MB),
      ],
      4,
      8 * MB,
    );
    expect(decision.accepted.length).toBe(1);
    expect(decision.rejected.length).toBe(2);
    expect(decision.limitHit).toBe(true);
  });

  test("blocks everything when the gallery is full", () => {
    const decision = decideStageFiles(
      [pick("x.jpg", "image/jpeg", MB)],
      5,
      8 * MB,
    );
    expect(decision.accepted).toEqual([]);
    expect(decision.limitHit).toBe(true);
  });
});

describe("gallery ordering", () => {
  test("moveToCover brings the chosen image first", () => {
    expect(moveToCover(["a", "b", "c"], 2)).toEqual(["c", "a", "b"]);
    expect(moveToCover(["a", "b"], 0)).toEqual(["a", "b"]);
    expect(moveToCover(["a"], 9)).toEqual(["a"]);
  });

  test("removeAtIndex drops one entry", () => {
    expect(removeAtIndex(["a", "b", "c"], 1)).toEqual(["a", "c"]);
    expect(removeAtIndex(["a"], 5)).toEqual(["a"]);
  });

  test("canAddMore reflects remaining slots", () => {
    expect(canAddMore(2, 2)).toBe(true);
    expect(canAddMore(3, 2)).toBe(false);
  });

  test("buildGalleryPayload dedupes and caps, cover first", () => {
    const cover = "/api/media/category/2026-09/cover.jpg";
    const second = "/api/media/category/2026-09/second.jpg";
    expect(buildGalleryPayload([cover], [second, cover])).toEqual([
      cover,
      second,
    ]);
    const many = Array.from(
      { length: 7 },
      (_, i) => `/api/media/category/2026-09/${i}.jpg`,
    );
    expect(buildGalleryPayload([], many).length).toBe(MAX_COVER_IMAGES);
  });

  test("displayNameFromUrl shows the last segment", () => {
    expect(displayNameFromUrl("/api/media/category/2026-09/cover.jpg")).toBe(
      "cover.jpg",
    );
    expect(displayNameFromUrl("")).toBe("Ảnh bìa");
    expect(displayNameFromUrl("/api/media/")).toBe("media");
  });
});
