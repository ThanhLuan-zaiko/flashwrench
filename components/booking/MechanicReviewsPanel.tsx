"use client";

import { FiLoader } from "react-icons/fi";
import { ReviewList } from "@/components/feedback/ReviewList";
import { useMechanicReviews } from "@/hooks/reviews";
import { useCursorPager } from "@/hooks/useCursorPager";

// Public review feed of one mechanic (booking + rescue reviews combined),
// cursor-paged. Mount it only while it is visible: it fetches on mount.
export function MechanicReviewsPanel({ mechanicId }: { mechanicId: string }) {
  const pager = useCursorPager();
  const reviews = useMechanicReviews(mechanicId, pager.cursor);
  const page = reviews.data?.reviews;

  return (
    <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
      {reviews.isPending && (
        <p
          aria-busy="true"
          className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400"
        >
          <FiLoader
            aria-hidden="true"
            className="h-3.5 w-3.5 motion-safe:animate-spin"
          />
          Đang tải đánh giá…
        </p>
      )}
      {reviews.isError && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          Không tải được đánh giá.
        </p>
      )}
      {page && (
        <ReviewList
          items={page.items}
          ratingAvg={page.ratingAvg}
          ratingCount={page.ratingCount}
          canPrev={pager.canPrev}
          canNext={Boolean(page.nextCursor)}
          onPrev={pager.prev}
          onNext={() => pager.next(page.nextCursor)}
          moderation={{ targetType: "mechanic", targetId: mechanicId }}
        />
      )}
    </div>
  );
}
