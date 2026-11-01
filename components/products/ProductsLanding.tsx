"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { HomePromoList } from "@/components/home/promotions/HomePromoList";
import { useMe } from "@/hooks/auth";
import { usePartsCatalogRealtime, usePublicParts } from "@/hooks/products";
import { useRealtimeStatus } from "@/hooks/useRealtimeStatus";
import { useCanonicalizePage, useRoutePage } from "@/hooks/useRoutePage";
import { ProductsCartCta } from "./ProductsCartCta";
import { ProductsIntro } from "./ProductsIntro";
import { type CatalogStatus, ProductsShelf } from "./ProductsShelf";
import {
  filterPublicParts,
  PRODUCTS_PAGE_SIZE,
  paginateParts,
  resolveCategoryBySlug,
} from "./products-utils";

// Public /products landing: browse the active parts shelf and add to cart.
// Admin catalog edits publish to the parts-catalog topic; this screen
// invalidates its query on each event and refetches over HTTPS.
//
// The active category comes from `?cat=<slug>` — one URL per tab so a
// filtered shelf stays shareable and the back button works. The screen
// stays mounted across query changes, so switching tabs reuses the cached
// catalog, keeps the search text, resets only the pager, and never
// replays the enter animation.
export function ProductsLanding() {
  const searchId = useId();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { page, firstPageHref, hrefFor } = useRoutePage();
  const catalog = usePublicParts();
  usePartsCatalogRealtime(true);
  const realtime = useRealtimeStatus();
  const live = realtime === "live";
  const me = useMe();

  const searchParams = useSearchParams();
  const activeSlug = searchParams.get("cat");

  const categories = useMemo(
    () => catalog.data?.categories ?? [],
    [catalog.data],
  );
  const parts = useMemo(() => catalog.data?.parts ?? [], [catalog.data]);
  const activeCategory = useMemo(
    () => resolveCategoryBySlug(categories, activeSlug),
    [categories, activeSlug],
  );
  const categoryId = activeCategory?.id ?? "";
  // An unknown slug only counts once the catalog has loaded: while pending
  // the category may simply not have arrived yet.
  const unknownSlug =
    catalog.isSuccess && activeSlug !== null && activeCategory === null;
  const filtered = useMemo(
    () => filterPublicParts(parts, { categoryId, query }),
    [parts, categoryId, query],
  );
  const view = useMemo(
    () => paginateParts(filtered, page - 1, PRODUCTS_PAGE_SIZE),
    [filtered, page],
  );

  // Switching the ?cat= tab rewrites the URL without /page/N, so only a
  // new search typed while deep-paged needs an explicit hop to the root —
  // firstPageHref keeps the active ?cat= on the way back.
  const typeQuery = (next: string) => {
    setQuery(next);
    if (page > 1) router.replace(firstPageHref, { scroll: false });
  };
  // view.safePage is 0-based; the URL segment is 1-based.
  const pageHref = (zeroBased: number) => hrefFor(zeroBased + 1);

  // Canonicalize: a typed /page/N beyond the last page rewrites itself to
  // the real last page once the catalog has loaded.
  useCanonicalizePage(view.pageCount, catalog.isSuccess);

  const showCartCta = me.isSuccess && me.data?.role === "customer";
  const status: CatalogStatus = catalog.isSuccess
    ? "success"
    : catalog.isError
      ? "error"
      : "pending";
  const countText = catalog.isPending
    ? "Đang tải sản phẩm…"
    : `${view.total} sản phẩm đang bán`;

  return (
    <div className="flex w-full flex-col">
      <ProductsIntro live={live} countText={countText} />
      <ProductsShelf
        status={status}
        onRetry={() => void catalog.refetch()}
        categories={categories}
        activeSlug={activeSlug}
        unknownSlug={unknownSlug}
        query={query}
        searchId={searchId}
        onQuery={typeQuery}
        view={view}
        pageHref={pageHref}
      />
      <HomePromoList title="Ưu đãi cho đơn linh kiện" audience="order" />
      <ProductsCartCta isCustomer={showCartCta} />
    </div>
  );
}
