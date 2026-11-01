"use client";

import { useRef } from "react";
import { useChapterMotion } from "@/hooks/useChapterMotion";
import type { PartCategoryItem } from "@/lib/parts/parts.types";
import { GuestOfferNote } from "../vouchers/GuestOfferNote";
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
      className="mx-auto max-w-7xl w-full px-4 pt-10 sm:px-6 md:pt-10 lg:px-8"
    >
      <ProductFilter
        categories={categories}
        activeSlug={unknownSlug ? null : activeSlug}
        query={query}
        searchId={searchId}
        onQuery={onQuery}
      />
      <div className="mt-6">
        <GuestOfferNote next="/products" />
      </div>
      <div className="mt-2 md:mt-4">
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
