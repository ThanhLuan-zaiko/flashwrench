import { Stars } from "@/components/feedback/Stars";
import { reviewTargetLabel } from "@/components/home/home-card-utils";
import type { LandingReview } from "@/lib/home/landing-reviews.service";

// One real review in the drifting row: stars and what was reviewed, then the
// full quote and the customer. A hairline on the left separates it from the
// previous review; the right padding is the gap before the next one.
export function RealReviewCard({ review }: { review: LandingReview }) {
  return (
    <li className="w-80 shrink-0 border-l border-zinc-200 pr-10 pl-6 md:w-[28rem] dark:border-zinc-800">
      <Stars
        rating={review.rating}
        size="h-4 w-4"
        label={`${review.rating} trên 5 sao`}
      />
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        {reviewTargetLabel(review.targetKind, review.targetName)}
      </p>
      <blockquote className="mt-3 text-base font-medium tracking-tight text-zinc-900 md:text-lg dark:text-zinc-50">
        “{review.quote}”
      </blockquote>
      <p className="mt-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        {review.customerName}
      </p>
    </li>
  );
}
