import { describe, expect, test } from "bun:test";
import {
  filterPublicServices,
  PUBLIC_CATALOG_PAGE_SIZE,
  paginatePublicServices,
  resolveTabCategory,
} from "@/components/services/public-catalog-utils";
import type {
  ServiceCategoryItem,
  ServiceItem,
} from "@/lib/catalog/service-catalog.types";

function makeItem(overrides?: Partial<ServiceItem>): ServiceItem {
  return {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    categoryId: "cat-a",
    categoryName: "Bao duong",
    name: "Thay dau dong co",
    slug: "thay-dau-dong-co",
    imageUrl: "",
    images: [],
    description: "Gom cong thay tai nha.",
    basePrice: 199000,
    priceUnit: "per_job",
    durationMin: 60,
    isHomeSupported: true,
    isEmergencySupported: false,
    isActive: true,
    isDeleted: false,
    createdAt: null,
    updatedAt: null,
    deletedAt: null,
    ...overrides,
  };
}

describe("filterPublicServices", () => {
  test("returns everything without a filter", () => {
    const items = [makeItem(), makeItem({ id: "s2", name: "Thay lop" })];
    expect(filterPublicServices(items, { categoryId: "", query: "" })).toEqual(
      items,
    );
  });

  test("filters by category", () => {
    const items = [
      makeItem({ id: "s1", categoryId: "cat-a" }),
      makeItem({ id: "s2", categoryId: "cat-b", name: "Thay lop" }),
    ];
    expect(
      filterPublicServices(items, { categoryId: "cat-b", query: "" }).map(
        (s) => s.id,
      ),
    ).toEqual(["s2"]);
  });

  test("matches names and descriptions case-insensitively", () => {
    const items = [
      makeItem({ id: "s1", name: "Thay dau", description: "Dong co" }),
      makeItem({ id: "s2", name: "Thay lop", description: "Banh xe" }),
    ];
    expect(
      filterPublicServices(items, { categoryId: "", query: "  LOP " }).map(
        (s) => s.id,
      ),
    ).toEqual(["s2"]);
    expect(
      filterPublicServices(items, { categoryId: "", query: "dong co" }).map(
        (s) => s.id,
      ),
    ).toEqual(["s1"]);
  });
});

describe("paginatePublicServices", () => {
  function many(count: number): ServiceItem[] {
    return Array.from({ length: count }, (_, index) =>
      makeItem({ id: `s${index}`, name: `Service ${index}` }),
    );
  }

  test("splits one page per eight services by default", () => {
    expect(PUBLIC_CATALOG_PAGE_SIZE).toBe(8);
    const view = paginatePublicServices(many(10), 0);
    expect(view.pageCount).toBe(2);
    expect(view.pageItems.length).toBe(8);
    expect(view.start).toBe(1);
    expect(view.end).toBe(8);
    expect(view.total).toBe(10);
  });

  test("clamps out-of-range pages instead of rendering empty", () => {
    const view = paginatePublicServices(many(3), 9);
    expect(view.safePage).toBe(0);
    expect(view.pageItems.length).toBe(3);
  });

  test("reports an empty range for an empty list", () => {
    const view = paginatePublicServices([], 0);
    expect(view.pageCount).toBe(1);
    expect(view.pageItems).toEqual([]);
    expect(view.start).toBe(0);
    expect(view.end).toBe(0);
    expect(view.total).toBe(0);
  });
});

describe("resolveTabCategory", () => {
  function makeCategory(
    overrides?: Partial<ServiceCategoryItem>,
  ): ServiceCategoryItem {
    return {
      id: "cat-a",
      name: "Bao duong",
      slug: "bao-duong",
      icon: "",
      imageUrl: "",
      images: [],
      description: "",
      sortOrder: 0,
      isActive: true,
      isDeleted: false,
      createdAt: null,
      updatedAt: null,
      deletedAt: null,
      serviceCount: 2,
      ...overrides,
    };
  }

  test("returns null for the all tab", () => {
    const categories = [makeCategory()];
    expect(resolveTabCategory(categories, null)).toBeNull();
    expect(resolveTabCategory(categories, "")).toBeNull();
  });

  test("matches the category by slug", () => {
    const categories = [
      makeCategory(),
      makeCategory({ id: "cat-b", name: "Cuu ho", slug: "cuu-ho" }),
    ];
    expect(resolveTabCategory(categories, "cuu-ho")?.id).toBe("cat-b");
  });

  test("returns null for unknown or retired slugs", () => {
    const categories = [makeCategory()];
    expect(resolveTabCategory(categories, "khong-ton-tai")).toBeNull();
    expect(resolveTabCategory([], "bao-duong")).toBeNull();
  });
});
