import { Stars } from "@/components/feedback/Stars";
import { reviewTargetLabel } from "@/components/home/home-card-utils";
import type { LandingReview } from "@/lib/home/landing-reviews.service";

// One real review as a static ruled row, used while there are too few
// reviews for a drifting marquee: rating and target, the quote, then the
// customer.
export function ReviewRow({ review }: { review: LandingReview }) {
  return (
    <li>
      <span
        data-rule
        aria-hidden="true"
        className="block h-px origin-left bg-zinc-200 dark:bg-zinc-800"
      />
      <div
        data-chapter-row
        className="grid gap-2 py-5 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)_minmax(0,12rem)] md:items-baseline md:gap-8 md:py-6"
      >
        <span className="flex flex-col gap-1.5">
          <Stars
            rating={review.rating}
            size="h-4 w-4"
            label={`${review.rating} trên 5 sao`}
          />
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {reviewTargetLabel(review.targetKind, review.targetName)}
          </span>
        </span>
        <blockquote className="text-lg font-medium tracking-tight text-zinc-900 md:text-xl dark:text-zinc-50">
          “{review.quote}”
        </blockquote>
        <span className="text-sm font-semibold text-zinc-700 md:text-right dark:text-zinc-300">
          {review.customerName}
        </span>
      </div>
    </li>
  );
}
