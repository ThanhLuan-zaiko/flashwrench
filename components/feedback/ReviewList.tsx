"use client";

import { FiChevronLeft, FiChevronRight, FiEye, FiEyeOff } from "react-icons/fi";
import { useAccountSession } from "@/hooks/auth";
import { useModerateReview } from "@/hooks/reviews";
import { formatDateTime } from "@/lib/datetime/format";
import type { ReviewItem } from "@/services/reviews.api";
import { Stars } from "./Stars";

// Public review feed: rating summary plus a newest-first list with
// Trước/Sau cursor paging. Used on product pages, mechanic profiles and
// the booking page. When `moderation` carries the feed's target,
// admin/dispatcher sessions get an inline hide/unhide per review and see
// hidden rows dimmed.
export function ReviewList({
  items,
  ratingAvg,
  ratingCount,
  onPrev,
  onNext,
  canPrev,
  canNext,
  emptyLabel = "Chưa có đánh giá nào.",
  moderation,
}: {
  items: ReviewItem[];
  ratingAvg: number;
  ratingCount: number;
  onPrev?: () => void;
  onNext?: () => void;
  canPrev?: boolean;
  canNext?: boolean;
  emptyLabel?: string;
  moderation?: {
    targetType: "mechanic" | "part" | "service";
    targetId: string;
  };
}) {
  const session = useAccountSession();
  const moderate = useModerateReview();
  const role = session.data?.user?.role;
  const canModerate = Boolean(
    moderation && role && ["admin", "dispatcher"].includes(role),
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Stars rating={ratingAvg} />
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {ratingCount > 0 ? ratingAvg.toFixed(1) : "—"}
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {ratingCount > 0 ? `${ratingCount} đánh giá` : "Chưa có đánh giá"}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-zinc-200 p-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          {emptyLabel}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
          {items.map((item) => (
            <li
              key={item.id}
              className={`flex flex-col gap-1 py-3 first:pt-0 ${
                item.hidden ? "opacity-60" : ""
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Stars rating={item.rating} size="h-3.5 w-3.5" />
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                  {item.customerName}
                </span>
                {item.hidden && (
                  <span className="rounded-full border border-red-300 px-1.5 py-px text-[11px] font-medium text-red-600 dark:border-red-800 dark:text-red-400">
                    Đã ẩn
                  </span>
                )}
                {item.createdAt && (
                  <time className="text-[11px] text-zinc-400 dark:text-zinc-500">
                    {formatDateTime(item.createdAt)}
                  </time>
                )}
                {canModerate && moderation && (
                  <button
                    type="button"
                    disabled={moderate.isPending}
                    onClick={() =>
                      moderate.mutate({
                        reviewId: item.id,
                        targetType: moderation.targetType,
                        targetId: moderation.targetId,
                        action: item.hidden ? "unhide" : "hide",
                      })
                    }
                    className="ml-auto flex min-h-[32px] items-center gap-1 rounded-lg px-2 text-[11px] font-medium text-zinc-500 transition-colors duration-200 hover:bg-zinc-100 hover:text-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  >
                    {item.hidden ? (
                      <FiEye aria-hidden="true" className="h-3.5 w-3.5" />
                    ) : (
                      <FiEyeOff aria-hidden="true" className="h-3.5 w-3.5" />
                    )}
                    {item.hidden ? "Hiện lại" : "Ẩn"}
                  </button>
                )}
              </div>
              {item.body && (
                <p className="text-xs whitespace-pre-line text-zinc-600 dark:text-zinc-300">
                  {item.body}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {(canPrev || canNext) && (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={!canPrev}
            aria-label="Trang trước"
            className="flex min-h-[44px] items-center gap-1 rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <FiChevronLeft aria-hidden="true" className="h-4 w-4" />
            Trước
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!canNext}
            aria-label="Trang sau"
            className="flex min-h-[44px] items-center gap-1 rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Sau
            <FiChevronRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
