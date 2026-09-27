import { describe, expect, test } from "bun:test";
import {
  EMPTY_STOCK_FILTER,
  filterStockParts,
  isStockFilterActive,
  LOW_STOCK_MAX,
  type StockFilter,
  stockCategoryOptions,
} from "@/app/dispatch/components/stock/stock-filters";
import type { PartItem } from "@/lib/parts/parts.types";

function part(overrides: Partial<PartItem> = {}): PartItem {
  return {
    id: "p1",
    sku: "SKU-01",
    name: "Linh kiện",
    slug: "linh-kien",
    brand: "Brand",
    categoryId: "cat-1",
    categoryName: "Danh mục",
    carBrands: [],
    carModels: [],
    price: 100_000,
    comparePrice: 0,
    stockQty: 20,
    soldCount: 0,
    images: [],
    imageUrl: "",
    specs: {},
    description: "",
    ratingAvg: 0,
    ratingCount: 0,
    isActive: true,
    isDeleted: false,
    createdAt: null,
    updatedAt: null,
    deletedAt: null,
    ...overrides,
  };
}

function filter(partial: Partial<StockFilter>): StockFilter {
  return { ...EMPTY_STOCK_FILTER, ...partial };
}

describe("filterStockParts", () => {
  const parts = [
    part({ id: "a", name: "Bùgi NGK Iridium", sku: "BG-01", brand: "NGK" }),
    part({
      id: "b",
      name: "Đèn pha LED",
      sku: "DP-02",
      brand: "Osram",
      categoryId: "cat-2",
      categoryName: "Điện & đèn",
      stockQty: 3,
    }),
    part({ id: "c", name: "Dầu nhớt Motul", sku: "DN-03", stockQty: 0 }),
  ];

  test("empty filter keeps everything", () => {
    expect(filterStockParts(parts, EMPTY_STOCK_FILTER)).toHaveLength(3);
  });

  test("query matches name regardless of Vietnamese diacritics", () => {
    expect(
      filterStockParts(parts, filter({ query: "bugi" })).map((p) => p.id),
    ).toEqual(["a"]);
    expect(
      filterStockParts(parts, filter({ query: "den pha" })).map((p) => p.id),
    ).toEqual(["b"]);
    expect(
      filterStockParts(parts, filter({ query: "dau nhot" })).map((p) => p.id),
    ).toEqual(["c"]);
  });

  test("query matches sku, brand and category too", () => {
    expect(
      filterStockParts(parts, filter({ query: "dp-02" })).map((p) => p.id),
    ).toEqual(["b"]);
    expect(
      filterStockParts(parts, filter({ query: "osram" })).map((p) => p.id),
    ).toEqual(["b"]);
    expect(
      filterStockParts(parts, filter({ query: "dien" })).map((p) => p.id),
    ).toEqual(["b"]);
  });

  test("category filter narrows to one group", () => {
    expect(
      filterStockParts(parts, filter({ categoryId: "cat-1" })).map((p) => p.id),
    ).toEqual(["a", "c"]);
  });

  test("stock levels split into in / low / out", () => {
    expect(
      filterStockParts(parts, filter({ level: "out" })).map((p) => p.id),
    ).toEqual(["c"]);
    expect(
      filterStockParts(parts, filter({ level: "low" })).map((p) => p.id),
    ).toEqual(["b"]);
    expect(
      filterStockParts(parts, filter({ level: "in" })).map((p) => p.id),
    ).toEqual(["a"]);
  });

  test("the low-stock boundary sits at LOW_STOCK_MAX", () => {
    const edge = [
      part({ id: "zero", stockQty: 0 }),
      part({ id: "edge", stockQty: LOW_STOCK_MAX }),
      part({ id: "over", stockQty: LOW_STOCK_MAX + 1 }),
    ];
    expect(
      filterStockParts(edge, filter({ level: "low" })).map((p) => p.id),
    ).toEqual(["edge"]);
  });

  test("filters compose: query + category + level", () => {
    const result = filterStockParts(
      parts,
      filter({ query: "motul", categoryId: "cat-1", level: "out" }),
    );
    expect(result.map((p) => p.id)).toEqual(["c"]);
    expect(
      filterStockParts(parts, filter({ query: "motul", categoryId: "cat-2" })),
    ).toHaveLength(0);
  });
});

describe("isStockFilterActive / stockCategoryOptions", () => {
  test("only a narrowed filter counts as active", () => {
    expect(isStockFilterActive(EMPTY_STOCK_FILTER)).toBe(false);
    expect(isStockFilterActive(filter({ query: "  " }))).toBe(false);
    expect(isStockFilterActive(filter({ query: "x" }))).toBe(true);
    expect(isStockFilterActive(filter({ level: "out" }))).toBe(true);
  });

  test("options dedupe categories and fall back to the id as name", () => {
    const options = stockCategoryOptions([
      part({ categoryId: "cat-b", categoryName: "Bộ truyền" }),
      part({ categoryId: "cat-a", categoryName: "Áo xe" }),
      part({ categoryId: "cat-b", categoryName: "Bộ truyền" }),
      part({ categoryId: "cat-c", categoryName: "" }),
      part({ categoryId: "", categoryName: "Không nhóm" }),
    ]);
    expect(options).toEqual([
      { id: "cat-a", name: "Áo xe" },
      { id: "cat-b", name: "Bộ truyền" },
      { id: "cat-c", name: "cat-c" },
    ]);
  });
});
