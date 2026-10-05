"use client";

import { Suspense } from "react";
import { FiLoader, FiRefreshCw } from "react-icons/fi";
import { ReviewList } from "@/components/feedback/ReviewList";
import { useProductReviews } from "@/hooks/reviews";
import { useEmbeddedPage } from "@/hooks/useEmbeddedPage";
import type { PartItem } from "@/lib/parts/parts.types";

// Lightweight review feed for the quick-view sheet: rating summary plus
// the newest reviews, cursor-paged on ?rv_page=N — the same param the
// detail page uses, so the convention stays shared. The parent keys this
// card by part id so a cursor is never reused across parts.
function ProductQuickViewReviewsInner({ part }: { part: PartItem }) {
  const pager = useEmbeddedPage("rv_page");
  const query = useProductReviews(part.slug, pager.cursor);
  const page = query.data?.reviews;

  return (
    <section
      aria-label="Đánh giá sản phẩm"
      className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Đánh giá sản phẩm
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{part.name}</p>
      </div>

      {query.isPending && (
        <p
          aria-busy="true"
          className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400"
        >
          <FiLoader
            aria-hidden="true"
            className="h-4 w-4 motion-safe:animate-spin"
          />
          Đang tải đánh giá…
        </p>
      )}

      {query.isError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-red-300 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          Không tải được đánh giá.
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-red-300 px-3 font-semibold hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-950"
          >
            <FiRefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
            Thử lại
          </button>
        </div>
      )}

      {page && (
        <ReviewList
          items={page.items}
          ratingAvg={page.ratingAvg}
          ratingCount={page.ratingCount}
          emptyLabel="Sản phẩm này chưa có đánh giá. Đánh giá sẽ xuất hiện sau khi khách hoàn tất đơn."
          canPrev={pager.canPrev}
          canNext={Boolean(page.nextCursor)}
          prevHref={pager.prevHref}
          nextHref={pager.nextHref}
          onNextClick={() => {
            if (page.nextCursor) pager.recordNext(page.nextCursor);
          }}
          moderation={{ targetType: "part", targetId: part.id }}
        />
      )}
    </section>
  );
}

// Suspense wrapper: useEmbeddedPage reads useSearchParams, which needs a
// boundary when the host page gets prerendered.
export function ProductQuickViewReviews({ part }: { part: PartItem }) {
  return (
    <Suspense fallback={null}>
      <ProductQuickViewReviewsInner part={part} />
    </Suspense>
  );
}
