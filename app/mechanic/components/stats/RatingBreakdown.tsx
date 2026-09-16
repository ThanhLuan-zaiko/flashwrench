import { FiStar } from "react-icons/fi";
import type { MechanicRatingBucket } from "@/services/mechanic.api";
import { BentoCard } from "../../../admin/components/bento/BentoCard";

// Star distribution from real reviews. Bar widths use fixed Tailwind
// fractions so no inline style is needed.
const BAR_WIDTHS = [
  "w-0",
  "w-1/12",
  "w-2/12",
  "w-3/12",
  "w-4/12",
  "w-5/12",
  "w-6/12",
  "w-7/12",
  "w-8/12",
  "w-9/12",
  "w-10/12",
  "w-11/12",
  "w-full",
] as const;

function barWidthClass(count: number, total: number): string {
  if (total <= 0 || count <= 0) return BAR_WIDTHS[0] as string;
  const step = Math.min(
    BAR_WIDTHS.length - 1,
    Math.round((count / total) * (BAR_WIDTHS.length - 1)),
  );
  return BAR_WIDTHS[step] as string;
}

export function RatingBreakdown({
  ratings,
  total,
}: {
  ratings: MechanicRatingBucket[];
  total: number;
}) {
  return (
    <BentoCard label="Phân bố đánh giá">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        <FiStar aria-hidden="true" className="h-4 w-4" />
        Phân bố điểm sao
      </h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {total > 0
          ? `${total} lượt đánh giá từ khách hàng`
          : "Chưa có đánh giá nào"}
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {ratings.map((bucket) => (
          <li key={bucket.stars} className="flex items-center gap-2 text-xs">
            <span className="w-8 shrink-0 font-semibold text-zinc-700 dark:text-zinc-300">
              {bucket.stars} ★
            </span>
            <span
              aria-hidden="true"
              className="h-2.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900"
            >
              <span
                className={`block h-full rounded-full bg-zinc-900 motion-safe:transition-all motion-safe:duration-200 dark:bg-zinc-100 ${barWidthClass(bucket.count, total)}`}
              />
            </span>
            <span className="w-8 shrink-0 text-right font-medium text-zinc-500 dark:text-zinc-400">
              {bucket.count}
            </span>
          </li>
        ))}
      </ul>
    </BentoCard>
  );
}
