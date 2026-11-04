"use client";

import { formatDateTime } from "@/lib/datetime/format";
import type { CommentItem } from "@/services/comments.api";

// Presentational comment row shared by top-level items and replies. Rows sit
// on the page surface divided by hairlines; staff replies are marked with a
// text label, not a tinted box. Hidden rows render dimmed with a label; only
// moderators ever receive them from the API.
export function CommentCard({
  item,
  actions,
}: {
  item: CommentItem;
  actions?: React.ReactNode;
}) {
  return (
    <div className={`py-2 ${item.hidden ? "opacity-60" : ""}`}>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
        <span className="font-semibold text-zinc-900 dark:text-zinc-50">
          {item.userName}
        </span>
        {item.staff && (
          <span className="font-semibold text-[#111111] dark:text-zinc-300">
            Nhân viên
          </span>
        )}
        {item.mine && (
          <span className="text-zinc-600 dark:text-zinc-400">(Bạn)</span>
        )}
        {item.hidden && (
          <span className="font-medium text-red-600 dark:text-red-400">
            Đã ẩn
          </span>
        )}
        {item.createdAt && (
          <time className="text-zinc-600 dark:text-zinc-400">
            {formatDateTime(item.createdAt)}
          </time>
        )}
      </p>
      <p className="mt-1 text-sm whitespace-pre-line text-zinc-800 dark:text-zinc-300">
        {item.body}
      </p>
      {actions && (
        <div className="mt-1 flex flex-wrap items-center gap-3">{actions}</div>
      )}
    </div>
  );
}
