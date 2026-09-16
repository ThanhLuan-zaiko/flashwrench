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

// Cover-image flow for categories, split from
// service-categories.service.test.ts to respect file line limits.
// Same harness: helpers first, mocks second, system under test last.
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

beforeEach(() => {
  resetServiceMocks();
});

describe("category cover images", () => {
  const COVER_URL = "/api/media/category/2026-09/cover.jpg";

  test("creates with a cover and relinks the asset to the new row", async () => {
    catalogStubs.categorySlugOwner = null;
    catalogStubs.categoryById = makeCategoryRow({
      slug: "sua-chua-luu-dong",
      image_url: COVER_URL,
    });
    const result = await createServiceCategory(
      makeCategoryInput({ imageUrl: COVER_URL, imageAssetId: "asset-1" }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.imageUrl).toBe(COVER_URL);
    expect(mediaRepoMocks.relinkAssetOwner.mock.calls[0]?.slice(0, 2)).toEqual([
      "asset-1",
      "category",
    ]);
    expect(categoryRepoMocks.insertCategory.mock.calls.length).toBe(1);
  });

  test("returns 404 for an unknown asset without writing", async () => {
    catalogStubs.categorySlugOwner = null;
    mediaRepoMocks.relinkAssetOwner.mockImplementationOnce(async () => false);
    const result = await createServiceCategory(
      makeCategoryInput({ imageUrl: COVER_URL, imageAssetId: "ghost" }),
    );
    expect(result).toMatchObject({ ok: false, status: 404 });
    expect(categoryRepoMocks.insertCategory.mock.calls.length).toBe(0);
  });

  test("updates the cover and relinks the asset to the row", async () => {
    catalogStubs.categoryById = makeCategoryRow({
      category_id: CATEGORY_ID,
      slug: "sua-chua-luu-dong",
      name: "Old",
    });
    catalogStubs.categorySlugOwner = null;
    const result = await updateServiceCategory(CATEGORY_ID, {
      ...makeCategoryInput(),
      slug: "sua-chua-luu-dong",
      imageUrl: COVER_URL,
      imageAssetId: "asset-9",
    });
    expect(result.ok).toBe(true);
    expect(mediaRepoMocks.relinkAssetOwner.mock.calls[0]).toEqual([
      "asset-9",
      "category",
      CATEGORY_ID,
    ]);
    expect(categoryRepoMocks.updateCategoryRow.mock.calls.length).toBe(1);
  });
});
