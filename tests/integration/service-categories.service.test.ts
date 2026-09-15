import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  makeCategoryInput,
  makeCategoryRow,
  makeServiceRow,
} from "../helpers/catalog.fixtures";
import {
  catalogServiceRepoMocks,
  catalogStubs,
  categoryRepoMocks,
  resetServiceMocks,
} from "../helpers/service-mocks";

// Helpers first, mocks second, system under test last: bun hoists
// mock.module above imports, matching tests/integration/*.test.ts.
mock.module(
  "@/lib/catalog/service-categories.repository",
  () => categoryRepoMocks,
);
mock.module("@/lib/catalog/services.repository", () => catalogServiceRepoMocks);

import {
  createServiceCategory,
  hardDeleteCategoryWithConfirm,
  listServiceCategories,
  restoreCategory,
  softDeleteCategory,
  toggleCategoryActive,
  updateServiceCategory,
} from "@/lib/catalog/service-categories.service";

const CATEGORY_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

beforeEach(() => {
  resetServiceMocks();
});

describe("listServiceCategories", () => {
  test("hides deleted rows, sorts by sort order, counts live services", async () => {
    catalogStubs.categoryRows = [
      makeCategoryRow({
        category_id: "c2",
        slug: "b",
        name: "B",
        sort_order: 2,
      }),
      makeCategoryRow({
        category_id: "c1",
        slug: "a",
        name: "A",
        sort_order: 1,
      }),
      makeCategoryRow({
        category_id: "c3",
        slug: "c",
        name: "C",
        sort_order: 0,
        is_deleted: true,
      }),
    ];
    catalogStubs.serviceRows = [
      makeServiceRow({ category_id: "c1" }),
      makeServiceRow({ category_id: "c1", service_id: "other", slug: "other" }),
      makeServiceRow({
        category_id: "c1",
        service_id: "gone",
        slug: "gone",
        is_deleted: true,
      }),
    ];
    const result = await listServiceCategories();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.map((c) => c.id)).toEqual(["c1", "c2"]);
    expect(result.data[0]?.serviceCount).toBe(2);
  });

  test("includes trash when requested", async () => {
    catalogStubs.categoryRows = [
      makeCategoryRow({
        is_deleted: true,
        deleted_at: new Date("2026-09-01T00:00:00.000Z"),
      }),
    ];
    const result = await listServiceCategories({ includeDeleted: true });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.length).toBe(1);
    expect(result.data[0]?.isDeleted).toBe(true);
  });
});

describe("createServiceCategory", () => {
  test("creates and returns the new category", async () => {
    catalogStubs.categorySlugOwner = null;
    catalogStubs.categoryById = makeCategoryRow({
      slug: "sua-chua-luu-dong",
      name: "Sua chua luu dong",
    });
    const result = await createServiceCategory(makeCategoryInput());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.slug).toBe("sua-chua-luu-dong");
    expect(categoryRepoMocks.insertCategory.mock.calls.length).toBe(1);
  });

  test("rejects duplicate slugs and invalid payloads", async () => {
    catalogStubs.categorySlugOwner = "someone-else";
    const conflict = await createServiceCategory(makeCategoryInput());
    expect(conflict).toMatchObject({ ok: false, status: 409 });
    expect(categoryRepoMocks.insertCategory.mock.calls.length).toBe(0);

    catalogStubs.categorySlugOwner = null;
    const invalid = await createServiceCategory(
      makeCategoryInput({ name: "  " }),
    );
    expect(invalid).toMatchObject({ ok: false, status: 400 });
  });
});

describe("updateServiceCategory", () => {
  test("moves the slug pointer when the slug changes", async () => {
    catalogStubs.categoryById = makeCategoryRow({
      category_id: CATEGORY_ID,
      slug: "old-slug",
      name: "Old",
    });
    catalogStubs.categorySlugOwner = null;
    const result = await updateServiceCategory(CATEGORY_ID, {
      ...makeCategoryInput(),
      name: "New name",
      slug: "new-slug",
    });
    expect(result.ok).toBe(true);
    expect(
      categoryRepoMocks.moveCategorySlug.mock.calls[0]?.slice(0, 2),
    ).toEqual(["old-slug", "new-slug"]);
  });

  test("returns 404 and refuses trashed rows", async () => {
    catalogStubs.categoryById = null;
    expect(
      await updateServiceCategory("ghost", makeCategoryInput()),
    ).toMatchObject({
      ok: false,
      status: 404,
    });
    catalogStubs.categoryById = makeCategoryRow({ is_deleted: true });
    expect(
      await updateServiceCategory(CATEGORY_ID, makeCategoryInput()),
    ).toMatchObject({
      ok: false,
      status: 400,
    });
  });
});

describe("toggleCategoryActive", () => {
  test("flips the flag and refuses trashed rows", async () => {
    catalogStubs.categoryById = makeCategoryRow({ is_active: true });
    const result = await toggleCategoryActive(CATEGORY_ID, false);
    expect(result.ok).toBe(true);
    expect(
      categoryRepoMocks.setCategoryActive.mock.calls[0]?.slice(0, 2),
    ).toEqual([CATEGORY_ID, false]);

    catalogStubs.categoryById = makeCategoryRow({ is_deleted: true });
    expect(await toggleCategoryActive(CATEGORY_ID, true)).toMatchObject({
      ok: false,
      status: 400,
    });
  });
});

describe("softDeleteCategory / restoreCategory", () => {
  test("soft deletes an empty category and restores it", async () => {
    catalogStubs.categoryById = makeCategoryRow();
    catalogStubs.serviceRows = [];
    const deleted = await softDeleteCategory(CATEGORY_ID);
    expect(deleted.ok).toBe(true);
    expect(
      categoryRepoMocks.setCategoryDeleted.mock.calls[0]?.slice(0, 2),
    ).toEqual([CATEGORY_ID, true]);

    catalogStubs.categoryById = makeCategoryRow({ is_deleted: true });
    const restored = await restoreCategory(CATEGORY_ID);
    expect(restored.ok).toBe(true);
    expect(categoryRepoMocks.setCategoryDeleted.mock.calls.length).toBe(2);
  });

  test("blocks soft delete while live services reference the category", async () => {
    catalogStubs.categoryById = makeCategoryRow();
    catalogStubs.serviceRows = [makeServiceRow({ category_id: CATEGORY_ID })];
    const result = await softDeleteCategory(CATEGORY_ID);
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(categoryRepoMocks.setCategoryDeleted.mock.calls.length).toBe(0);
  });

  test("refuses double soft delete and restore outside trash", async () => {
    catalogStubs.categoryById = makeCategoryRow({ is_deleted: true });
    expect(await softDeleteCategory(CATEGORY_ID)).toMatchObject({
      ok: false,
      status: 400,
    });
    catalogStubs.categoryById = makeCategoryRow({ is_deleted: false });
    expect(await restoreCategory(CATEGORY_ID)).toMatchObject({
      ok: false,
      status: 400,
    });
  });
});

describe("hardDeleteCategoryWithConfirm", () => {
  test("permanently deletes an empty category on slug confirm", async () => {
    catalogStubs.categoryById = makeCategoryRow({
      category_id: CATEGORY_ID,
      slug: "bao-duong-tai-nha",
    });
    catalogStubs.serviceRows = [];
    const result = await hardDeleteCategoryWithConfirm(
      CATEGORY_ID,
      "bao-duong-tai-nha",
    );
    expect(result.ok).toBe(true);
    expect(categoryRepoMocks.hardDeleteCategory.mock.calls[0]).toEqual([
      CATEGORY_ID,
      "bao-duong-tai-nha",
    ]);
  });

  test("rejects wrong confirm text without touching storage", async () => {
    catalogStubs.categoryById = makeCategoryRow({ slug: "bao-duong-tai-nha" });
    const result = await hardDeleteCategoryWithConfirm(
      CATEGORY_ID,
      "wrong-slug",
    );
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(categoryRepoMocks.hardDeleteCategory.mock.calls.length).toBe(0);
  });

  test("blocks hard delete while any service still references the category", async () => {
    catalogStubs.categoryById = makeCategoryRow({
      category_id: CATEGORY_ID,
      slug: "bao-duong-tai-nha",
    });
    catalogStubs.serviceRows = [
      makeServiceRow({ category_id: CATEGORY_ID, is_deleted: true }),
    ];
    const result = await hardDeleteCategoryWithConfirm(
      CATEGORY_ID,
      "bao-duong-tai-nha",
    );
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(categoryRepoMocks.hardDeleteCategory.mock.calls.length).toBe(0);
  });
});
