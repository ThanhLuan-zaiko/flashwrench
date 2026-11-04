"use client";

import { Suspense, useRef } from "react";
import { FiLoader, FiRefreshCw } from "react-icons/fi";
import { CommentSection } from "@/components/feedback/CommentSection";
import { ReviewList } from "@/components/feedback/ReviewList";
import { commentKeys } from "@/hooks/comments";
import { productsKeys } from "@/hooks/products";
import { reviewKeys, useProductReviews } from "@/hooks/reviews";
import { useChapterMotion } from "@/hooks/useChapterMotion";
import { useDomainRealtime } from "@/hooks/useDomainRealtime";
import { useEmbeddedPage } from "@/hooks/useEmbeddedPage";
import { partTopic } from "@/lib/realtime/protocol";
import { ProductChapterHead } from "./ProductChapterHead";
import { ProductReviewComposer } from "./ProductReviewComposer";

// Public product feedback: the review feed (cursor-paged, with the
// rating summary), the buyer-only star rating entry and the public comment
// thread for the part, side by side from lg so a short feed does not leave
// the row half empty. The review page lives in ?rv_page=N so the parent
// product URL stays untouched.
function ProductReviewsSectionInner({
  slug,
  partId,
  partName,
}: {
  slug: string;
  partId: string;
  partName?: string;
}) {
  const rootRef = useRef<HTMLElement>(null);
  useChapterMotion(rootRef);
  const pager = useEmbeddedPage("rv_page");
  const query = useProductReviews(slug, pager.cursor);
  const reviews = query.data?.reviews;

  // Live updates for everyone watching this product: a new comment or
  // review on the part refreshes the thread (including expanded reply
  // lists), the review feed and the rating summary in the header.
  useDomainRealtime(
    partId ? partTopic(partId) : "",
    [commentKeys.all, reviewKeys.product(slug), productsKeys.detail(slug)],
    Boolean(partId),
  );

  return (
    <section
      ref={rootRef}
      aria-label="Đánh giá sản phẩm"
      className="flex flex-col gap-8 pt-12 md:pt-16"
    >
      <ProductChapterHead title="Đánh giá từ khách hàng" />

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="flex min-w-0 flex-col gap-8">
          {query.isPending && (
            <p
              aria-busy="true"
              className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400"
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
                className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-red-600 px-3 font-semibold hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-950"
              >
                <FiRefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
                Thử lại
              </button>
            </div>
          )}

          {reviews && (
            <ReviewList
              items={reviews.items}
              ratingAvg={reviews.ratingAvg}
              ratingCount={reviews.ratingCount}
              canPrev={pager.canPrev}
              canNext={Boolean(reviews.nextCursor)}
              prevHref={pager.prevHref}
              nextHref={pager.nextHref}
              onNextClick={() => {
                if (reviews.nextCursor) pager.recordNext(reviews.nextCursor);
              }}
              moderation={{ targetType: "part", targetId: partId }}
            />
          )}

          <ProductReviewComposer slug={slug} partName={partName} />
        </div>
        <div className="min-w-0">
          <CommentSection
            targetType="part"
            targetId={partId}
            title="Hỏi đáp & bình luận"
          />
        </div>
      </div>
    </section>
  );
}

// Suspense wrapper: useEmbeddedPage reads useSearchParams, which needs a
// boundary when the host page gets prerendered.
export function ProductReviewsSection(props: {
  slug: string;
  partId: string;
  partName?: string;
}) {
  return (
    <Suspense fallback={null}>
      <ProductReviewsSectionInner {...props} />
    </Suspense>
  );
}
