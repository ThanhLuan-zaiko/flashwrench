import type { PartCategoryItem, PartItem } from "@/lib/parts/parts.types";

export const PRODUCTS_PAGE_SIZE = 8;

export type ProductsFilter = {
  categoryId: string;
  query: string;
};

// Filter visible parts by category then a case-insensitive match on name,
// brand or SKU. Pure helper so the landing stays small and testable.
export function filterPublicParts(
  parts: PartItem[],
  filter: ProductsFilter,
): PartItem[] {
  const query = filter.query.trim().toLowerCase();
  return parts.filter((part) => {
    if (filter.categoryId && part.categoryId !== filter.categoryId) {
      return false;
    }
    if (!query) return true;
    return (
      part.name.toLowerCase().includes(query) ||
      part.brand.toLowerCase().includes(query) ||
      part.sku.toLowerCase().includes(query)
    );
  });
}

// Resolve the `?cat=` slug to a live category. Null means the "all" tab;
// unknown slugs resolve to null so the landing can show a guidance panel
// instead of guessing.
export function resolveCategoryBySlug(
  categories: PartCategoryItem[],
  slug: string | null,
): PartCategoryItem | null {
  if (!slug) return null;
  return categories.find((category) => category.slug === slug) ?? null;
}

export type ProductsPage = {
  pageItems: PartItem[];
  pageCount: number;
  safePage: number;
  start: number;
  end: number;
  total: number;
};

// Clamp the page into range and slice one page of items.
export function paginateParts(
  parts: PartItem[],
  page: number,
  pageSize = PRODUCTS_PAGE_SIZE,
): ProductsPage {
  const total = parts.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 0), pageCount - 1);
  const start = safePage * pageSize;
  const pageItems = parts.slice(start, start + pageSize);
  return {
    pageItems,
    pageCount,
    safePage,
    start: total === 0 ? 0 : start + 1,
    end: start + pageItems.length,
    total,
  };
}

export function discountPercent(price: number, comparePrice: number): number {
  if (comparePrice <= 0 || comparePrice <= price) return 0;
  return Math.round(((comparePrice - price) / comparePrice) * 100);
}

export function stockLabel(part: PartItem): string {
  if (part.stockQty <= 0) return "Hết hàng";
  if (part.stockQty <= 5) return `Còn ${part.stockQty} sản phẩm`;
  return "Còn hàng";
}
