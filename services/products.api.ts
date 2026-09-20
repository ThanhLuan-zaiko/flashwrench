import type { PartCategoryItem, PartItem } from "@/lib/parts/parts.types";
import { apiRequest } from "./auth.api";

export type PublicPartsResponse = {
  categories: PartCategoryItem[];
  parts: PartItem[];
};

// Public shop fetch: no auth needed, guests browse active parts only.
export function fetchPublicParts(): Promise<PublicPartsResponse> {
  return apiRequest<PublicPartsResponse>("/api/products");
}

export function fetchPublicPart(slug: string): Promise<{ part: PartItem }> {
  return apiRequest<{ part: PartItem }>(
    `/api/products/${encodeURIComponent(slug)}`,
  );
}
