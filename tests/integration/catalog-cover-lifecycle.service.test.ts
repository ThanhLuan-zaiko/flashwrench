import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  makeCategoryInput,
  makeCategoryRow,
  makeServiceInput,
  makeServiceRow,
} from "../helpers/catalog.fixtures";
import { makeMediaRow, makeOwnerAssetRef } from "../helpers/media.fixtures";
import {
  catalogServiceRepoMocks,
  catalogStubs,
  categoryRepoMocks,
  mediaRepoMocks,
  mediaStorageMocks,
  mediaStubs,
  resetServiceMocks,
} from "../helpers/service-mocks";

// Cover lifecycle: gallery edits prune removed files, hard deletes purge
// the whole gallery (files plus registry). Soft delete keeps everything
// for restore. Same harness as the gallery suite, plus storage mocks.
mock.module(
  "@/lib/catalog/service-categories.repository",
  () => categoryRepoMocks,
);
mock.module("@/lib/catalog/services.repository", () => catalogServiceRepoMocks);
mock.module("@/lib/media/media.repository", () => mediaRepoMocks);
mock.module("@/lib/media/media-storage", () => mediaStorageMocks);

import {
  hardDeleteCategoryWithConfirm,
  updateServiceCategory,
} from "@/lib/catalog/service-categories.service";
import {
  hardDeleteServiceWithConfirm,
  updateService,
} from "@/lib/catalog/services.service";

const CATEGORY_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const SERVICE_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const FIRST = "/api/media/category/2026-09/first.jpg";
const SECOND = "/api/media/category/2026-09/second.jpg";
const OLD_COVER = "/api/media/service/2026-09/old.jpg";
const NEW_COVER = "/api/media/service/2026-09/new.jpg";

function rowsById(rows: ReturnType<typeof makeMediaRow>[]) {
  const byId = new Map(rows.map((r) => [r.asset_id, r]));
  mediaRepoMocks.findAssetRowById.mockImplementation(
    async (id: string) => byId.get(id) ?? null,
  );
}

beforeEach(() => {
  resetServiceMocks();
});

describe("category cover lifecycle", () => {
  test("update prunes removed covers but keeps the new gallery", async () => {
    catalogStubs.categoryById = makeCategoryRow({
      category_id: CATEGORY_ID,
      slug: "sua-chua-luu-dong",
      name: "Old",
      image_url: FIRST,
      images: [FIRST, SECOND],
    });
    catalogStubs.categorySlugOwner = null;
    mediaStubs.ownerAssets = [
      makeOwnerAssetRef({ assetId: "asset-1", url: FIRST }),
      makeOwnerAssetRef({ assetId: "asset-2", url: SECOND }),
      makeOwnerAssetRef({ assetId: "asset-x", url: "/api/media/misc/z.jpg" }),
    ];
    rowsById([
      makeMediaRow({
        asset_id: "asset-1",
        owner_type: "category",
        owner_id: CATEGORY_ID,
        url: FIRST,
        file_path: "category/2026-09/first.jpg",
      }),
      makeMediaRow({
        asset_id: "asset-2",
        owner_type: "category",
        owner_id: CATEGORY_ID,
        url: SECOND,
        file_path: "category/2026-09/second.jpg",
      }),
      makeMediaRow({
        asset_id: "asset-x",
        owner_type: "misc",
        owner_id: "other-owner",
        url: "/api/media/misc/z.jpg",
        file_path: "misc/2026-09/z.jpg",
      }),
    ]);
    const result = await updateServiceCategory(CATEGORY_ID, {
      ...makeCategoryInput(),
      slug: "sua-chua-luu-dong",
      imageUrl: SECOND,
      images: [SECOND],
    });
    expect(result.ok).toBe(true);
    expect(mediaStorageMocks.deleteAssetFile.mock.calls).toEqual([
      ["category/2026-09/first.jpg"],
    ]);
    expect(mediaRepoMocks.deleteAssetRows.mock.calls.length).toBe(1);
    expect(mediaRepoMocks.deleteAssetRows.mock.calls[0]?.[0]).toBe("asset-1");
  });

  test("hard delete purges the whole gallery with the row", async () => {
    catalogStubs.categoryById = makeCategoryRow({
      category_id: CATEGORY_ID,
      slug: "sua-chua-luu-dong",
      image_url: FIRST,
      images: [FIRST, SECOND],
    });
    catalogStubs.serviceRows = [];
    mediaStubs.ownerAssets = [
      makeOwnerAssetRef({ assetId: "asset-1", url: FIRST }),
      makeOwnerAssetRef({ assetId: "asset-2", url: SECOND }),
    ];
    rowsById([
      makeMediaRow({
        asset_id: "asset-1",
        owner_type: "category",
        owner_id: CATEGORY_ID,
        url: FIRST,
        file_path: "category/2026-09/first.jpg",
      }),
      makeMediaRow({
        asset_id: "asset-2",
        owner_type: "category",
        owner_id: CATEGORY_ID,
        url: SECOND,
        file_path: "category/2026-09/second.jpg",
      }),
    ]);
    const result = await hardDeleteCategoryWithConfirm(
      CATEGORY_ID,
      "sua-chua-luu-dong",
    );
    expect(result.ok).toBe(true);
    expect(categoryRepoMocks.hardDeleteCategory.mock.calls.length).toBe(1);
    expect(mediaStorageMocks.deleteAssetFile.mock.calls.length).toBe(2);
    expect(mediaRepoMocks.deleteAssetRows.mock.calls.length).toBe(2);
  });
});

describe("service cover lifecycle", () => {
  test("update deletes the replaced cover file", async () => {
    catalogStubs.serviceById = makeServiceRow({ image_url: OLD_COVER });
    catalogStubs.categoryById = makeCategoryRow();
    catalogStubs.serviceSlugOwner = null;
    mediaStubs.ownerAssets = [
      makeOwnerAssetRef({ assetId: "asset-9", url: OLD_COVER }),
    ];
    rowsById([
      makeMediaRow({
        asset_id: "asset-9",
        owner_type: "service",
        owner_id: SERVICE_ID,
        url: OLD_COVER,
        file_path: "service/2026-09/old.jpg",
      }),
    ]);
    const result = await updateService(SERVICE_ID, {
      ...makeServiceInput(),
      imageUrl: NEW_COVER,
    });
    expect(result.ok).toBe(true);
    expect(mediaStorageMocks.deleteAssetFile.mock.calls).toEqual([
      ["service/2026-09/old.jpg"],
    ]);
    expect(mediaRepoMocks.deleteAssetRows.mock.calls.length).toBe(1);
  });

  test("hard delete purges the cover with the row", async () => {
    catalogStubs.serviceById = makeServiceRow({
      service_id: SERVICE_ID,
      slug: "thay-dau-dong-co",
      image_url: OLD_COVER,
    });
    mediaStubs.ownerAssets = [
      makeOwnerAssetRef({ assetId: "asset-9", url: OLD_COVER }),
    ];
    rowsById([
      makeMediaRow({
        asset_id: "asset-9",
        owner_type: "service",
        owner_id: SERVICE_ID,
        url: OLD_COVER,
        file_path: "service/2026-09/old.jpg",
      }),
    ]);
    const result = await hardDeleteServiceWithConfirm(
      SERVICE_ID,
      "thay-dau-dong-co",
    );
    expect(result.ok).toBe(true);
    expect(mediaStorageMocks.deleteAssetFile.mock.calls.length).toBe(1);
    expect(mediaRepoMocks.deleteAssetRows.mock.calls.length).toBe(1);
  });
});
