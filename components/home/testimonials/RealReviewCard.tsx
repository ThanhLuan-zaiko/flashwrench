import { Stars } from "@/components/feedback/Stars";
import { reviewTargetLabel } from "@/components/home/home-card-utils";
import type { LandingReview } from "@/lib/home/landing-reviews.service";

type RealReviewCardProps = {
  review: LandingReview;
  // Sizing from the caller: the drifting row sets a fixed width and gap, the
  // static grid lets the grid cell decide.
  className?: string;
};

// One real review as a card: stars and what was reviewed, the quote, then the
// customer below a hairline.
export function RealReviewCard({
  review,
  className = "",
}: RealReviewCardProps) {
  return (
    <li className={className}>
      <article className="flex h-full w-full flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 md:p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <Stars
          rating={review.rating}
          size="h-4 w-4"
          label={`${review.rating} trên 5 sao`}
        />
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {reviewTargetLabel(review.targetKind, review.targetName)}
        </p>
        <blockquote className="flex-1 text-base font-medium tracking-tight text-zinc-900 md:text-lg dark:text-zinc-50">
          “{review.quote}”
        </blockquote>
        <p className="border-t border-zinc-200 pt-3 text-sm font-semibold text-zinc-800 dark:border-zinc-800 dark:text-zinc-300">
          {review.customerName}
        </p>
      </article>
    </li>
  );
}
