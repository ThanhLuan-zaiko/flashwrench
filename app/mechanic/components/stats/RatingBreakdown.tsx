import { FiStar } from "react-icons/fi";
import { swatchClass } from "@/components/charts/chart-palette";
import { RingChart } from "@/components/charts/RingChart";
import { StackedBarChart } from "@/components/charts/StackedBarChart";
import type {
  MechanicRatingBucket,
  MechanicReviewItem,
} from "@/services/mechanic.api";
import { BentoCard } from "../../../admin/components/bento/BentoCard";
import { formatShortDate } from "../mechanic-format";

type RatingBreakdownProps = {
  ratings: MechanicRatingBucket[];
  total: number;
  average: number;
  latest?: MechanicReviewItem;
};

// Average rating as a canvas ring plus the star split as one stacked bar,
// both GSAP-animated; the legend rows carry the exact counts as text.
export function RatingBreakdown({
  ratings,
  total,
  average,
  latest,
}: RatingBreakdownProps) {
  const sorted = [...ratings].sort((a, b) => b.stars - a.stars);
  const averageText = total > 0 ? average.toFixed(1).replace(".", ",") : "—";

  return (
    <BentoCard label="Phân bố đánh giá" tour="mech-stats-rating">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        <FiStar aria-hidden="true" className="h-4 w-4" />
        Phân bố điểm sao
      </h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {total > 0
          ? `${total} lượt đánh giá từ khách hàng`
          : "Chưa có đánh giá nào"}
      </p>
      <div className="mt-3 flex justify-center">
        <RingChart
          value={total > 0 ? average : 0}
          max={5}
          label={`Điểm trung bình ${averageText} trên 5`}
        >
          <span className="text-2xl font-extrabold text-[#1E3A5F] dark:text-zinc-50">
            {averageText}
          </span>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
            trên 5 sao
          </span>
        </RingChart>
      </div>
      {total > 0 && (
        <>
          <StackedBarChart
            values={sorted
              .slice(0, 3)
              .map((b) => b.count)
              .concat(sorted.slice(3).reduce((sum, b) => sum + b.count, 0))}
            label="Tỷ trọng số sao"
            className="mt-4 h-4 w-full"
          />
          <ul className="mt-2 flex flex-col gap-1.5">
            {sorted.map((bucket, index) => (
              <li
                key={bucket.stars}
                className="flex items-center gap-2 text-xs"
              >
                <span
                  aria-hidden="true"
                  className={`h-2.5 w-2.5 rounded-sm ${swatchClass(Math.min(index, 3))}`}
                />
                <span className="flex-1 font-semibold text-zinc-700 dark:text-zinc-300">
                  {bucket.stars} sao
                </span>
                <span className="font-medium text-zinc-600 tabular-nums dark:text-zinc-400">
                  {bucket.count}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
      {latest?.comment && (
        <blockquote className="mt-4 border-t border-zinc-100 pt-3 text-[13px] text-zinc-700 dark:border-zinc-900 dark:text-zinc-300">
          “{latest.comment}”
          <footer className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {latest.customerName || "Khách hàng"} ·{" "}
            {formatShortDate(latest.createdAt)}
          </footer>
        </blockquote>
      )}
    </BentoCard>
  );
}
