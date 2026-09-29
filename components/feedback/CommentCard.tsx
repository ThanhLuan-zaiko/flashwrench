"use client";

import { formatDateTime } from "@/lib/datetime/format";
import type { CommentItem } from "@/services/comments.api";

// Presentational comment row shared by top-level items and replies.
// Hidden rows render dimmed with a badge — only moderators ever receive
// them from the API.
export function CommentCard({
  item,
  actions,
}: {
  item: CommentItem;
  actions?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border px-3 py-2 ${
        item.hidden
          ? "border-zinc-200 opacity-60 dark:border-zinc-800"
          : item.staff
            ? "border-zinc-300 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900"
            : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <p className="flex flex-wrap items-center gap-2 text-[11px]">
        <span className="font-semibold text-zinc-900 dark:text-zinc-50">
          {item.userName}
        </span>
        {item.staff && (
          <span className="rounded-full border border-zinc-300 px-1.5 py-px font-medium text-zinc-600 dark:border-zinc-600 dark:text-zinc-300">
            Nhân viên
          </span>
        )}
        {item.mine && (
          <span className="text-zinc-400 dark:text-zinc-500">(Bạn)</span>
        )}
        {item.hidden && (
          <span className="rounded-full border border-red-300 px-1.5 py-px font-medium text-red-600 dark:border-red-800 dark:text-red-400">
            Đã ẩn
          </span>
        )}
        {item.createdAt && (
          <time className="text-zinc-400 dark:text-zinc-500">
            {formatDateTime(item.createdAt)}
          </time>
        )}
      </p>
      <p className="mt-1 text-xs whitespace-pre-line text-zinc-700 dark:text-zinc-300">
        {item.body}
      </p>
      {actions && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          {actions}
        </div>
      )}
    </div>
  );
}
