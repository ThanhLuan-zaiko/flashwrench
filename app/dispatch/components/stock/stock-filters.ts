import type { PartItem } from "@/lib/parts/parts.types";
import { normalizeSearchText } from "@/lib/search-text";

// "Sắp hết" shares the storefront warning threshold in stockLabel.
export const LOW_STOCK_MAX = 5;

export type StockLevel = "all" | "in" | "low" | "out";

export type StockFilter = {
  query: string;
  categoryId: string;
  level: StockLevel;
};

export const EMPTY_STOCK_FILTER: StockFilter = {
  query: "",
  categoryId: "",
  level: "all",
};

export function isStockFilterActive(filter: StockFilter): boolean {
  return (
    filter.query.trim() !== "" ||
    filter.categoryId !== "" ||
    filter.level !== "all"
  );
}

function matchesStockLevel(part: PartItem, level: StockLevel): boolean {
  switch (level) {
    case "out":
      return part.stockQty <= 0;
    case "low":
      return part.stockQty > 0 && part.stockQty <= LOW_STOCK_MAX;
    case "in":
      return part.stockQty > LOW_STOCK_MAX;
    default:
      return true;
  }
}

// The query matches name, SKU, brand or category after Vietnamese
// normalization so "bugi" finds "Bùgi NGK" and "den" finds "Đèn pha".
function matchesStockQuery(part: PartItem, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true;
  return [part.name, part.sku, part.brand, part.categoryName].some((value) =>
    normalizeSearchText(value).includes(normalizedQuery),
  );
}

export function filterStockParts(
  parts: PartItem[],
  filter: StockFilter,
): PartItem[] {
  const query = normalizeSearchText(filter.query);
  return parts.filter(
    (part) =>
      (!filter.categoryId || part.categoryId === filter.categoryId) &&
      matchesStockLevel(part, filter.level) &&
      matchesStockQuery(part, query),
  );
}

export type StockCategoryOption = { id: string; name: string };

// Distinct categories present in the loaded list, sorted by name — the
// toolbar select only offers categories that actually have stock rows.
export function stockCategoryOptions(parts: PartItem[]): StockCategoryOption[] {
  const names = new Map<string, string>();
  for (const part of parts) {
    if (part.categoryId && !names.has(part.categoryId)) {
      names.set(part.categoryId, part.categoryName || part.categoryId);
    }
  }
  return [...names.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "vi"));
}
