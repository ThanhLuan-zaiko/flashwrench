import { Stars } from "@/components/feedback/Stars";
import { reviewTargetLabel } from "@/components/home/home-card-utils";
import type { LandingReview } from "@/lib/home/landing-reviews.service";

// One real review from reviews_by_target. The muted surface separates it
// from the curated quote cards below; the footer names what was reviewed.
export function RealReviewCard({ review }: { review: LandingReview }) {
  return (
    <li
      data-reveal
      className="flex flex-col justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-100/60 p-4 md:p-5 dark:border-zinc-800 dark:bg-zinc-900/50"
    >
      <div>
        <Stars
          rating={review.rating}
          size="h-3.5 w-3.5"
          label={`${review.rating} trên 5 sao`}
        />
        <blockquote className="mt-2 text-sm text-zinc-700 line-clamp-4 dark:text-zinc-300">
          “{review.quote}”
        </blockquote>
      </div>
      <div>
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {review.customerName}
        </p>
        <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
          {reviewTargetLabel(review.targetKind, review.targetName)}
        </p>
      </div>
    </li>
  );
}
