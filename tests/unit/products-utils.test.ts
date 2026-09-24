// Public parts landing helpers: filter by category + free-text match,
// page clamping, discount math and stock labels. Pure helpers lifted from
// ProductsLanding so they stay testable without rendering.
import { describe, expect, test } from "bun:test";
import {
  discountPercent,
  filterPublicParts,
  galleryStep,
  normalizeGalleryImages,
  PRODUCTS_PAGE_SIZE,
  paginateParts,
  stockLabel,
} from "@/components/products/products-utils";
import type { PartItem } from "@/lib/parts/parts.types";

function makePart(overrides?: Partial<PartItem>): PartItem {
  return {
    id: "p1",
    sku: "DN-10W40",
    name: "Dau nhot 10W-40",
    slug: "dau-nhot-10w-40",
    brand: "Shell",
    categoryId: "cat-oil",
    categoryName: "Dau nhot",
    carBrands: ["Honda"],
    carModels: ["Wave"],
    price: 120000,
    comparePrice: 0,
    stockQty: 10,
    soldCount: 3,
    images: [],
    imageUrl: "",
    specs: {},
    description: "",
    ratingAvg: 0,
    ratingCount: 0,
    isActive: true,
    isDeleted: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    deletedAt: null,
    ...overrides,
  };
}

describe("filterPublicParts", () => {
  const parts = [
    makePart({ id: "p1", categoryId: "cat-oil", name: "Dau nhot Shell" }),
    makePart({
      id: "p2",
      categoryId: "cat-brake",
      name: "Ma phanh",
      sku: "BP-01",
    }),
    makePart({
      id: "p3",
      categoryId: "cat-oil",
      name: "Loc gio",
      brand: "Bosch",
    }),
  ];

  test("no filter returns every part", () => {
    const result = filterPublicParts(parts, { categoryId: "", query: "" });
    expect(result.map((p) => p.id)).toEqual(["p1", "p2", "p3"]);
  });

  test("category filter keeps only that category", () => {
    const result = filterPublicParts(parts, {
      categoryId: "cat-oil",
      query: "",
    });
    expect(result.map((p) => p.id)).toEqual(["p1", "p3"]);
  });

  test("query matches name, brand and sku case-insensitively", () => {
    expect(
      filterPublicParts(parts, { categoryId: "", query: "NGK" }).map(
        (p) => p.id,
      ),
    ).toEqual([]);
    expect(
      filterPublicParts(parts, { categoryId: "", query: "dau" }).map(
        (p) => p.id,
      ),
    ).toEqual(["p1"]);
    expect(
      filterPublicParts(parts, { categoryId: "", query: "bosch" }).map(
        (p) => p.id,
      ),
    ).toEqual(["p3"]);
    expect(
      filterPublicParts(parts, { categoryId: "", query: "bp-01" }).map(
        (p) => p.id,
      ),
    ).toEqual(["p2"]);
  });

  test("category and query combine", () => {
    const result = filterPublicParts(parts, {
      categoryId: "cat-oil",
      query: "loc",
    });
    expect(result.map((p) => p.id)).toEqual(["p3"]);
  });
});

describe("paginateParts", () => {
  const parts = Array.from({ length: PRODUCTS_PAGE_SIZE * 2 + 1 }, (_, i) =>
    makePart({ id: `p${i}` }),
  );

  test("slices one page and reports the window", () => {
    const page = paginateParts(parts, 0);
    expect(page.pageItems).toHaveLength(PRODUCTS_PAGE_SIZE);
    expect(page.pageCount).toBe(3);
    expect(page.safePage).toBe(0);
    expect(page.start).toBe(1);
    expect(page.end).toBe(PRODUCTS_PAGE_SIZE);
    expect(page.total).toBe(parts.length);
  });

  test("clamps out-of-range pages instead of emptying", () => {
    expect(paginateParts(parts, 99).safePage).toBe(2);
    expect(paginateParts(parts, -5).safePage).toBe(0);
  });

  test("empty list still reports one page", () => {
    const page = paginateParts([], 0);
    expect(page.pageItems).toHaveLength(0);
    expect(page.pageCount).toBe(1);
    expect(page.start).toBe(0);
  });
});

describe("discountPercent", () => {
  test("computes whole percents against the compare price", () => {
    expect(discountPercent(75000, 100000)).toBe(25);
    expect(discountPercent(120000, 0)).toBe(0);
    expect(discountPercent(120000, 120000)).toBe(0);
    expect(discountPercent(130000, 120000)).toBe(0);
  });
});

describe("normalizeGalleryImages", () => {
  test("drops empty entries and duplicates while preserving order", () => {
    expect(normalizeGalleryImages(["a", "", "b", "a", "c", "b"])).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  test("returns an empty list for empty input", () => {
    expect(normalizeGalleryImages([])).toEqual([]);
    expect(normalizeGalleryImages(["", ""])).toEqual([]);
  });
});

describe("galleryStep", () => {
  test("wraps forward and backward around the set", () => {
    expect(galleryStep(4, 1, 5)).toBe(0);
    expect(galleryStep(0, -1, 5)).toBe(4);
    expect(galleryStep(2, 1, 5)).toBe(3);
    expect(galleryStep(2, -1, 5)).toBe(1);
  });

  test("clamps to 0 when the gallery is empty", () => {
    expect(galleryStep(0, 1, 0)).toBe(0);
    expect(galleryStep(3, -1, 0)).toBe(0);
  });
});

describe("stockLabel", () => {
  test("maps stock tiers to Vietnamese labels", () => {
    expect(stockLabel(makePart({ stockQty: 0 }))).toBe("Hết hàng");
    expect(stockLabel(makePart({ stockQty: 3 }))).toBe("Còn 3 sản phẩm");
    expect(stockLabel(makePart({ stockQty: 50 }))).toBe("Còn hàng");
  });
});
