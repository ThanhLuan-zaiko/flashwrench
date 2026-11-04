"use client";

import Link from "next/link";
import { FiChevronLeft, FiChevronRight, FiEye, FiEyeOff } from "react-icons/fi";
import { scrollToPageTop } from "@/components/pagination/scroll-to-page-top";
import { useAccountSession } from "@/hooks/auth";
import { useModerateReview } from "@/hooks/reviews";
import { formatDateTime } from "@/lib/datetime/format";
import type { ReviewItem } from "@/services/reviews.api";
import { Stars } from "./Stars";

// Pager links: bold text with an arrow, no border or box.
const PAGER_LINK =
  "flex min-h-11 items-center gap-1 text-sm font-bold text-[#1D4ED8] underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] dark:text-blue-300 dark:focus-visible:ring-zinc-100";
const PAGER_IDLE =
  "flex min-h-11 items-center gap-1 text-sm font-bold text-zinc-600 dark:text-zinc-400";

// Public review feed: rating summary plus a newest-first list with
// Trước/Sau cursor paging. Used on product pages, mechanic profiles and
// the booking page. When `moderation` carries the feed's target,
// admin/dispatcher sessions get an inline hide/unhide per review and see
// hidden rows dimmed. Reviews are ruled rows, not boxes.
export function ReviewList({
  items,
  ratingAvg,
  ratingCount,
  prevHref,
  nextHref,
  onNextClick,
  canPrev,
  canNext,
  emptyLabel = "Chưa có đánh giá nào.",
  moderation,
}: {
  items: ReviewItem[];
  ratingAvg: number;
  ratingCount: number;
  prevHref?: string;
  nextHref?: string;
  // Records the just-fetched pageState token before the "next" nav so the
  // target page stays reachable inside this session.
  onNextClick?: () => void;
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
        <Stars rating={ratingAvg} size="h-3.5 w-3.5" />
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {ratingCount > 0 ? ratingAvg.toFixed(1) : "—"}
        </span>
        <span className="text-xs text-zinc-600 dark:text-zinc-400">
          {ratingCount > 0 ? `${ratingCount} đánh giá` : "Chưa có đánh giá"}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-zinc-600 dark:text-zinc-400">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
          {items.map((item) => (
            <li
              key={item.id}
              className={`flex flex-col gap-1 py-3 first:pt-0 ${
                item.hidden ? "opacity-60" : ""
              }`}
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Stars rating={item.rating} size="h-3 w-3" />
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                  {item.customerName}
                </span>
                {item.hidden && (
                  <span className="text-xs font-medium text-red-600 dark:text-red-400">
                    Đã ẩn
                  </span>
                )}
                {item.createdAt && (
                  <time className="text-xs text-zinc-600 dark:text-zinc-400">
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
                    className="ml-auto flex min-h-[32px] items-center gap-1 rounded-lg px-2 text-xs font-medium text-[#111111] transition-colors duration-200 hover:bg-[#FB923C]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-50 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
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
                <p className="text-sm whitespace-pre-line text-zinc-800 dark:text-zinc-300">
                  {item.body}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {(canPrev || canNext) && (
        <div data-pager className="flex items-center justify-end gap-5">
          {canPrev && prevHref ? (
            <Link
              href={prevHref}
              scroll={false}
              onClick={scrollToPageTop}
              prefetch
              aria-label="Trang trước"
              className={PAGER_LINK}
            >
              <FiChevronLeft aria-hidden="true" className="h-4 w-4" />
              Trước
            </Link>
          ) : (
            <span aria-disabled="true" className={PAGER_IDLE}>
              <FiChevronLeft aria-hidden="true" className="h-4 w-4" />
              Trước
            </span>
          )}
          {canNext && nextHref ? (
            <Link
              href={nextHref}
              scroll={false}
              prefetch
              onClick={(event) => {
                scrollToPageTop(event);
                onNextClick?.();
              }}
              aria-label="Trang sau"
              className={PAGER_LINK}
            >
              Sau
              <FiChevronRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          ) : (
            <span aria-disabled="true" className={PAGER_IDLE}>
              Sau
              <FiChevronRight aria-hidden="true" className="h-4 w-4" />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
