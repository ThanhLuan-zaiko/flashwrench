"use client";

import { useRef } from "react";
import { useChapterMotion } from "@/hooks/useChapterMotion";
import type { PartCategoryItem } from "@/lib/parts/parts.types";
import { ProductFilter } from "./ProductFilter";
import { ProductsResults } from "./ProductsResults";
import {
  ProductsEmptyNotice,
  ProductsErrorNotice,
  ProductsSkeleton,
  ProductsUnknownCategory,
} from "./ProductsShelfStates";
import type { ProductsPage } from "./products-utils";

export type CatalogStatus = "pending" | "error" | "success";

type ProductsShelfProps = {
  status: CatalogStatus;
  onRetry: () => void;
  categories: PartCategoryItem[];
  activeSlug: string | null;
  unknownSlug: boolean;
  query: string;
  searchId: string;
  onQuery: (next: string) => void;
  view: ProductsPage;
  pageHref: (zeroBased: number) => string;
};

// Shelf chapter: category tabs and search, then the tile grid with its pager.
// Motion starts once the catalog has loaded, so the skeleton never fades.
export function ProductsShelf({
  status,
  onRetry,
  categories,
  activeSlug,
  unknownSlug,
  query,
  searchId,
  onQuery,
  view,
  pageHref,
}: ProductsShelfProps) {
  const rootRef = useRef<HTMLElement>(null);
  useChapterMotion(rootRef, status !== "pending");

  return (
    <section
      ref={rootRef}
      aria-label="Danh sách sản phẩm"
      className="w-full px-4 pt-10 sm:px-6 md:pt-10 lg:px-10"
    >
      <ProductFilter
        categories={categories}
        activeSlug={unknownSlug ? null : activeSlug}
        query={query}
        searchId={searchId}
        onQuery={onQuery}
      />
      <div className="mt-8 md:mt-10">
        {status === "pending" && <ProductsSkeleton />}
        {status === "error" && <ProductsErrorNotice onRetry={onRetry} />}
        {status === "success" && unknownSlug && <ProductsUnknownCategory />}
        {status === "success" && !unknownSlug && view.total === 0 && (
          <ProductsEmptyNotice />
        )}
        {status === "success" && !unknownSlug && view.total > 0 && (
          <ProductsResults view={view} hrefFor={pageHref} />
        )}
      </div>
    </section>
  );
}
