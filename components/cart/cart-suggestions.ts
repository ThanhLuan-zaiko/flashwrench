import type { PartItem } from "@/lib/parts/parts.types";

export const CART_SUGGESTION_LIMIT = 4;

// Parts to suggest under an empty cart: live and in stock, photographed
// ones first, then best sellers.
export function pickCartSuggestions(
  parts: PartItem[],
  limit = CART_SUGGESTION_LIMIT,
): PartItem[] {
  return parts
    .filter((part) => part.isActive && !part.isDeleted && part.stockQty > 0)
    .sort(
      (a, b) =>
        (b.imageUrl ? 1 : 0) - (a.imageUrl ? 1 : 0) ||
        b.soldCount - a.soldCount,
    )
    .slice(0, Math.max(0, limit));
}
