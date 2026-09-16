import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makeCategoryRow, makeServiceRow } from "../helpers/catalog.fixtures";
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

import { listPublicCatalog } from "@/lib/catalog/public-catalog.service";

beforeEach(() => {
  resetServiceMocks();
});

describe("listPublicCatalog", () => {
  test("exposes only active rows with a live parent category", async () => {
    catalogStubs.categoryRows = [
      makeCategoryRow({ category_id: "cat-a", sort_order: 0 }),
      makeCategoryRow({
        category_id: "cat-off",
        name: "Tam tat",
        slug: "tam-tat",
        is_active: false,
      }),
      makeCategoryRow({
        category_id: "cat-gone",
        name: "Da xoa",
        slug: "da-xoa",
        is_deleted: true,
      }),
    ];
    catalogStubs.serviceRows = [
      makeServiceRow({
        service_id: "s1",
        category_id: "cat-a",
        image_url: "/api/media/service/2026-09/cover.jpg",
      }),
      makeServiceRow({
        service_id: "s2",
        category_id: "cat-a",
        name: "Tam tat",
        slug: "tam-tat-gia",
        is_active: false,
      }),
      makeServiceRow({
        service_id: "s3",
        category_id: "cat-a",
        name: "Da xoa",
        slug: "da-xoa-gia",
        is_deleted: true,
      }),
      makeServiceRow({
        service_id: "s4",
        category_id: "cat-off",
        name: "Mo covej nhung cha tat",
        slug: "cha-tat",
      }),
      makeServiceRow({
        service_id: "s5",
        category_id: "cat-gone",
        name: "Cha da xoa",
        slug: "cha-da-xoa",
      }),
      makeServiceRow({
        service_id: "s6",
        category_id: "cat-missing",
        category_name: "Missing",
        name: "Mo coi",
        slug: "mo-coi",
      }),
    ];
    const result = await listPublicCatalog();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.categories.map((c) => c.id)).toEqual(["cat-a"]);
    expect(result.data.services.map((s) => s.id)).toEqual(["s1"]);
    expect(result.data.services[0]?.imageUrl).toBe(
      "/api/media/service/2026-09/cover.jpg",
    );
  });

  test("lets repository failures bubble to the route 500 handler", async () => {
    catalogStubs.categoryRows = [];
    catalogStubs.serviceRows = [makeServiceRow()];
    categoryRepoMocks.listCategoryRows.mockRejectedValueOnce(
      new Error("db down"),
    );
    await expect(listPublicCatalog()).rejects.toThrow("db down");
  });
});
