import { FiStar } from "react-icons/fi";
import type { MechanicReviewItem } from "@/services/mechanic.api";
import { BentoCard } from "../../../admin/components/bento/BentoCard";
import { formatShortDate } from "../mechanic-format";

// Latest customer reviews of this mechanic, newest first.
export function ReviewList({ reviews }: { reviews: MechanicReviewItem[] }) {
  return (
    <BentoCard label="Đánh giá mới nhất">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Khách nói gì
      </h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Nhận xét mới nhất từ khách hàng
      </p>
      {reviews.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-zinc-200 px-3 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Chưa có nhận xét nào. Hoàn thành đơn để nhận đánh giá đầu tiên.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-zinc-200 rounded-2xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {reviews.map((review) => (
            <li key={review.id} className="px-3 py-2.5">
              <p className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  {review.customerName || "Khách hàng"}
                </span>
                <span
                  className="flex shrink-0 items-center gap-1 text-xs font-bold text-zinc-800 dark:text-zinc-200"
                  role="img"
                  aria-label={`${review.rating} trên 5 sao`}
                >
                  <FiStar aria-hidden="true" className="h-3.5 w-3.5" />
                  {review.rating}/5
                </span>
              </p>
              {review.comment && (
                <p className="mt-1 line-clamp-2 text-xs text-zinc-600 dark:text-zinc-300">
                  {review.comment}
                </p>
              )}
              <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                {formatShortDate(review.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </BentoCard>
  );
}
