import { Stars } from "@/components/feedback/Stars";
import { reviewTargetLabel } from "@/components/home/home-card-utils";
import type { LandingReview } from "@/lib/home/landing-reviews.service";

// One real review as a ruled row: stars and what was reviewed on the left,
// the quote and the customer on the right.
export function RealReviewCard({ review }: { review: LandingReview }) {
  return (
    <li>
      <span
        data-rule
        aria-hidden="true"
        className="block h-px origin-left bg-zinc-200 dark:bg-zinc-800"
      />
      <div
        data-chapter-row
        className="grid grid-cols-1 gap-3 py-6 md:grid-cols-[16rem_minmax(0,1fr)] md:gap-x-10 md:py-8"
      >
        <div>
          <Stars
            rating={review.rating}
            size="h-4 w-4"
            label={`${review.rating} trên 5 sao`}
          />
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {reviewTargetLabel(review.targetKind, review.targetName)}
          </p>
        </div>
        <div className="min-w-0">
          <blockquote className="line-clamp-4 text-lg font-medium tracking-tight text-zinc-900 md:text-2xl dark:text-zinc-50">
            “{review.quote}”
          </blockquote>
          <p className="mt-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            {review.customerName}
          </p>
        </div>
      </div>
    </li>
  );
}
