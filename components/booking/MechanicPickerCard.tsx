"use client";

import { useState } from "react";
import {
  FiChevronDown,
  FiLoader,
  FiMessageSquare,
  FiStar,
  FiUser,
  FiWifi,
} from "react-icons/fi";
import { ReviewList } from "@/components/feedback/ReviewList";
import { useMechanicReviews } from "@/hooks/reviews";
import type { MechanicDirectoryItem } from "@/lib/mechanic/mechanic-directory.service";

function formatDistance(distanceKm: number | null): string {
  if (distanceKm === null) return "";
  return distanceKm < 1
    ? `Cách bạn khoảng ${Math.max(1, Math.round(distanceKm * 1000))} m`
    : `Cách bạn khoảng ${distanceKm.toFixed(1)} km`;
}

function cardClasses(active: boolean): string {
  return `flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors duration-200 ${
    active
      ? "border-zinc-900 bg-zinc-100 dark:border-white dark:bg-zinc-900"
      : "border-zinc-300 dark:border-zinc-700"
  }`;
}

// One mechanic card in the booking picker: radio select plus an
// expandable public review feed (booking + rescue reviews combined).
export function MechanicPickerCard({
  item,
  selected,
  onSelect,
}: {
  item: MechanicDirectoryItem;
  selected: boolean;
  onSelect: (mechanicId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([]);
  const reviews = useMechanicReviews(open ? item.id : null, cursor);
  const page = reviews.data?.reviews;

  return (
    <div className="flex flex-col gap-1">
      <label className={cardClasses(selected)}>
        <input
          type="radio"
          name="mechanicPick"
          checked={selected}
          onChange={() => onSelect(item.id)}
          aria-label={`Chọn thợ ${item.displayName}`}
          className="h-4 w-4 shrink-0 accent-zinc-900 dark:accent-white"
        />
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          <FiUser aria-hidden="true" className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {item.displayName}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <FiStar aria-hidden="true" className="h-3 w-3" />
              {item.ratingAvg.toFixed(1)} · {item.completedJobs} đơn
            </span>
            {item.distanceKm !== null && (
              <span>{formatDistance(item.distanceKm)}</span>
            )}
            <span className="flex items-center gap-1">
              <FiWifi aria-hidden="true" className="h-3 w-3" />
              Đang trực tuyến
            </span>
          </span>
          {item.skills.length > 0 && (
            <span className="mt-1 block truncate text-[11px] text-zinc-500 dark:text-zinc-400">
              {item.skills.join(" · ")}
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-label={`Xem đánh giá của thợ ${item.displayName}`}
          className="flex min-h-[44px] shrink-0 items-center gap-1 rounded-lg border border-zinc-300 px-2.5 text-[11px] font-semibold text-zinc-600 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <FiMessageSquare aria-hidden="true" className="h-3.5 w-3.5" />
          <FiChevronDown
            aria-hidden="true"
            className={`h-3.5 w-3.5 motion-safe:transition-transform motion-safe:duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </label>

      {open && (
        <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
          {reviews.isPending && (
            <p
              aria-busy="true"
              className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400"
            >
              <FiLoader
                aria-hidden="true"
                className="h-3.5 w-3.5 motion-safe:animate-spin"
              />
              Đang tải đánh giá…
            </p>
          )}
          {reviews.isError && (
            <p role="alert" className="text-xs text-red-600 dark:text-red-400">
              Không tải được đánh giá.
            </p>
          )}
          {page && (
            <ReviewList
              items={page.items}
              ratingAvg={page.ratingAvg}
              ratingCount={page.ratingCount}
              canPrev={cursorStack.length > 0}
              canNext={Boolean(page.nextCursor)}
              onPrev={() => {
                const stack = [...cursorStack];
                stack.pop();
                setCursorStack(stack);
                setCursor(stack[stack.length - 1] ?? null);
              }}
              onNext={() => {
                setCursorStack((stack) => [...stack, cursor]);
                setCursor(page.nextCursor);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
