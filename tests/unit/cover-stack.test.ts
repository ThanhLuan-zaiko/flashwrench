import { describe, expect, test } from "bun:test";
import { coverStackImages } from "@/app/admin/components/services/cover-stack";

// Gallery contract behind CatalogCoverStack rows: the saved gallery always
// wins, the legacy single cover is only a fallback, and blank URLs never
// reach an <img>. Pure helper, so no mocks are needed anywhere in this
// file.
describe("coverStackImages", () => {
  test("prefers the saved gallery over the single cover", () => {
    expect(coverStackImages(["a.jpg", "b.jpg"], "cover.jpg")).toEqual([
      "a.jpg",
      "b.jpg",
    ]);
  });

  test("falls back to the single cover when the gallery is empty", () => {
    expect(coverStackImages([], "cover.jpg")).toEqual(["cover.jpg"]);
    expect(coverStackImages(null, "cover.jpg")).toEqual(["cover.jpg"]);
    expect(coverStackImages(undefined, "cover.jpg")).toEqual(["cover.jpg"]);
  });

  test("returns an empty list when nothing is stored", () => {
    expect(coverStackImages([], "")).toEqual([]);
    expect(coverStackImages(null, "  ")).toEqual([]);
  });

  test("drops blank gallery entries before deciding", () => {
    expect(coverStackImages(["", "  ", "a.jpg"], "cover.jpg")).toEqual([
      "a.jpg",
    ]);
    expect(coverStackImages([" ", ""], "cover.jpg")).toEqual(["cover.jpg"]);
  });
});
