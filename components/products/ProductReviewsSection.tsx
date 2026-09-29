"use client";

import { FiLoader, FiRefreshCw } from "react-icons/fi";
import { CommentSection } from "@/components/feedback/CommentSection";
import { ReviewList } from "@/components/feedback/ReviewList";
import { commentKeys } from "@/hooks/comments";
import { productsKeys } from "@/hooks/products";
import { reviewKeys, useProductReviews } from "@/hooks/reviews";
import { useCursorPager } from "@/hooks/useCursorPager";
import { useDomainRealtime } from "@/hooks/useDomainRealtime";
import { partTopic } from "@/lib/realtime/protocol";
import { ProductReviewComposer } from "./ProductReviewComposer";

// Public product feedback: the review feed (cursor-paged, with the
// rating summary), the buyer-only star rating entry and the public comment
// thread for the part.
export function ProductReviewsSection({
  slug,
  partId,
  partName,
}: {
  slug: string;
  partId: string;
  partName?: string;
}) {
  const pager = useCursorPager();
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
      data-reveal
      aria-label="Đánh giá sản phẩm"
      className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Đánh giá từ khách hàng
      </h2>

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

      {reviews && (
        <ReviewList
          items={reviews.items}
          ratingAvg={reviews.ratingAvg}
          ratingCount={reviews.ratingCount}
          canPrev={pager.canPrev}
          canNext={Boolean(reviews.nextCursor)}
          onPrev={pager.prev}
          onNext={() => pager.next(reviews.nextCursor)}
          moderation={{ targetType: "part", targetId: partId }}
        />
      )}

      <div className="flex flex-col gap-5 border-t border-zinc-100 pt-5 dark:border-zinc-800">
        <ProductReviewComposer slug={slug} partName={partName} />
        <CommentSection
          targetType="part"
          targetId={partId}
          title="Hỏi đáp & bình luận"
        />
      </div>
    </section>
  );
}
