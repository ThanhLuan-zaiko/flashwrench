"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { FiArrowRight, FiRefreshCw } from "react-icons/fi";
import { BigTypeHeader } from "@/components/bento/BigTypeHeader";
import { useMe } from "@/hooks/auth";
import { usePartsCatalogRealtime, usePublicParts } from "@/hooks/products";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { useRealtimeStatus } from "@/hooks/useRealtimeStatus";
import { ProductCard } from "./ProductCard";
import { ProductFilter } from "./ProductFilter";
import { ProductsCartCta } from "./ProductsCartCta";
import { ProductsPager } from "./ProductsPager";
import {
  filterPublicParts,
  PRODUCTS_PAGE_SIZE,
  paginateParts,
  resolveCategoryBySlug,
} from "./products-utils";

// Static skeleton ids keep React keys stable without array indexes.
const SKELETON_IDS = [
  "skeleton-1",
  "skeleton-2",
  "skeleton-3",
  "skeleton-4",
  "skeleton-5",
  "skeleton-6",
  "skeleton-7",
  "skeleton-8",
];

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
  const rootRef = useBentoReveal<HTMLDivElement>();
  const searchId = useId();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
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
    () => paginateParts(filtered, page, PRODUCTS_PAGE_SIZE),
    [filtered, page],
  );

  // Reset the pager whenever the URL tab changes. Adjusted during render
  // (the documented reset-on-prop-change pattern) so no effect re-runs and
  // no animation replays for a mere tab switch.
  const [tabKey, setTabKey] = useState(activeSlug);
  if (tabKey !== activeSlug) {
    setTabKey(activeSlug);
    setPage(0);
  }

  const typeQuery = (next: string) => {
    setQuery(next);
    setPage(0);
  };

  const showCartCta = me.isSuccess && me.data?.role === "customer";

  return (
    <div ref={rootRef} className="flex flex-col gap-6 md:gap-8">
      <BigTypeHeader
        level={1}
        eyebrow="Sản phẩm"
        title="Linh kiện chính hãng, giao tận nơi."
        subtitle="Giá công khai, tồn kho cập nhật trực tiếp. Thêm vào giỏ và đặt hàng trong vài bước."
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <output
          aria-label={live ? "Realtime đang hoạt động" : "Realtime mất kết nối"}
          className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400"
        >
          <span
            aria-hidden="true"
            className={`h-2 w-2 rounded-full ${
              live
                ? "bg-zinc-900 dark:bg-white"
                : "border border-zinc-400 dark:border-zinc-500"
            }`}
          />
          {live ? "Giá cập nhật trực tiếp" : "Đang nối lại giá trực tiếp…"}
        </output>
        <p
          aria-live="polite"
          className="text-xs text-zinc-500 dark:text-zinc-400"
        >
          {catalog.isPending
            ? "Đang tải sản phẩm…"
            : `${view.total} sản phẩm đang bán`}
        </p>
      </div>

      <ProductFilter
        categories={categories}
        activeSlug={unknownSlug ? null : activeSlug}
        query={query}
        searchId={searchId}
        onQuery={typeQuery}
      />

      {unknownSlug && (
        <div
          data-reveal
          className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950"
        >
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Danh mục này không còn được áp dụng
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Cửa hàng vừa thay đổi danh mục. Hãy xem toàn bộ sản phẩm đang có.
          </p>
          <Link
            href="/products"
            scroll={false}
            className="mx-auto mt-4 flex min-h-[44px] w-fit items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-950"
          >
            Xem tất cả sản phẩm
            <FiArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      )}

      {catalog.isPending && (
        <div
          aria-busy="true"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4"
        >
          <p className="sr-only">Đang tải sản phẩm</p>
          {SKELETON_IDS.map((skeletonId) => (
            <div
              key={skeletonId}
              className="h-44 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
            />
          ))}
        </div>
      )}

      {catalog.isError && (
        <div
          role="alert"
          data-reveal
          className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          <p className="font-semibold">Không tải được danh sách sản phẩm.</p>
          <p className="mt-1 text-xs">Vui lòng kiểm tra mạng rồi thử lại.</p>
          <button
            type="button"
            onClick={() => void catalog.refetch()}
            className="mt-3 flex min-h-[44px] items-center gap-1.5 rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold transition-colors duration-200 hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 motion-safe:active:scale-[0.99] dark:border-red-800 dark:hover:bg-red-950"
          >
            <FiRefreshCw aria-hidden="true" className="h-4 w-4" />
            Thử tải lại
          </button>
        </div>
      )}

      {catalog.isSuccess && !unknownSlug && view.total === 0 && (
        <div
          data-reveal
          className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950"
        >
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Chưa có sản phẩm phù hợp
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Hãy thử từ khóa khác hoặc chọn danh mục khác.
          </p>
        </div>
      )}

      {catalog.isSuccess && !unknownSlug && view.total > 0 && (
        <div className="flex flex-col gap-3 md:gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
            {view.pageItems.map((part) => (
              <ProductCard key={part.id} part={part} />
            ))}
          </div>
          <ProductsPager
            page={view.safePage}
            pageCount={view.pageCount}
            start={view.start}
            end={view.end}
            total={view.total}
            onChange={setPage}
          />
        </div>
      )}

      <ProductsCartCta isCustomer={showCartCta} />
    </div>
  );
}
