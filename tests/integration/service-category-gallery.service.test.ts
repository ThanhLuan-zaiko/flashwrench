import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  makeCategoryInput,
  makeCategoryRow,
} from "../helpers/catalog.fixtures";
import {
  catalogServiceRepoMocks,
  catalogStubs,
  categoryRepoMocks,
  mediaRepoMocks,
  resetServiceMocks,
} from "../helpers/service-mocks";

// Multi-cover gallery for categories: deferred uploads land via
// images/imageAssetIds, the first URL mirrors image_url for legacy
// readers. Split from service-category-covers to respect line limits.
mock.module(
  "@/lib/catalog/service-categories.repository",
  () => categoryRepoMocks,
);
mock.module("@/lib/catalog/services.repository", () => catalogServiceRepoMocks);
mock.module("@/lib/media/media.repository", () => mediaRepoMocks);

import {
  createServiceCategory,
  updateServiceCategory,
} from "@/lib/catalog/service-categories.service";

const CATEGORY_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const FIRST = "/api/media/category/2026-09/first.jpg";
const SECOND = "/api/media/category/2026-09/second.jpg";

beforeEach(() => {
  resetServiceMocks();
});

describe("category cover gallery", () => {
  test("creates with two covers, claims both, mirrors the first", async () => {
    catalogStubs.categorySlugOwner = null;
    catalogStubs.categoryById = makeCategoryRow({
      slug: "sua-chua-luu-dong",
      image_url: FIRST,
      images: [FIRST, SECOND],
    });
    const result = await createServiceCategory(
      makeCategoryInput({
        imageUrl: FIRST,
        imageAssetId: "asset-1",
        images: [FIRST, SECOND],
        imageAssetIds: ["asset-1", "asset-2"],
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.imageUrl).toBe(FIRST);
    expect(result.data.images).toEqual([FIRST, SECOND]);
    expect(mediaRepoMocks.relinkAssetOwner.mock.calls.length).toBe(2);
    const inserted = categoryRepoMocks.insertCategory.mock.calls[0]?.[0] as {
      imageUrl: string;
      images: string[];
    };
    expect(inserted.imageUrl).toBe(FIRST);
    expect(inserted.images).toEqual([FIRST, SECOND]);
  });

  test("legacy single-cover input still yields a one-item gallery", async () => {
    catalogStubs.categorySlugOwner = null;
    catalogStubs.categoryById = makeCategoryRow({
      slug: "sua-chua-luu-dong",
      image_url: FIRST,
      images: [FIRST],
    });
    const result = await createServiceCategory(
      makeCategoryInput({ imageUrl: FIRST, imageAssetId: "asset-1" }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.images).toEqual([FIRST]);
  });

  test("unknown gallery asset aborts without writing", async () => {
    catalogStubs.categorySlugOwner = null;
    mediaRepoMocks.relinkAssetOwner.mockImplementationOnce(async () => false);
    const result = await createServiceCategory(
      makeCategoryInput({
        imageUrl: FIRST,
        images: [FIRST, SECOND],
        imageAssetIds: ["ghost", "asset-2"],
      }),
    );
    expect(result).toMatchObject({ ok: false, status: 404 });
    expect(categoryRepoMocks.insertCategory.mock.calls.length).toBe(0);
  });

  test("updates reorder the gallery and keep the new cover first", async () => {
    catalogStubs.categoryById = makeCategoryRow({
      category_id: CATEGORY_ID,
      slug: "sua-chua-luu-dong",
      name: "Old",
      image_url: FIRST,
      images: [FIRST],
    });
    catalogStubs.categorySlugOwner = null;
    const result = await updateServiceCategory(CATEGORY_ID, {
      ...makeCategoryInput(),
      slug: "sua-chua-luu-dong",
      imageUrl: SECOND,
      images: [SECOND, FIRST],
      imageAssetIds: ["asset-9"],
    });
    expect(result.ok).toBe(true);
    const updated = categoryRepoMocks.updateCategoryRow.mock.calls[0]?.[0] as {
      imageUrl: string;
      images: string[];
    };
    expect(updated.imageUrl).toBe(SECOND);
    expect(updated.images).toEqual([SECOND, FIRST]);
  });
});
