"use client";

import { FiChevronLeft, FiChevronRight, FiEye, FiEyeOff } from "react-icons/fi";
import { useModerateComment, useReplies } from "@/hooks/comments";
import { useCursorPager } from "@/hooks/useCursorPager";
import type { CommentTargetType } from "@/services/comments.api";
import { CommentCard } from "./CommentCard";

// Replies under one comment, oldest first with Trước/Sau paging.
// Moderators get an inline hide/unhide toggle on each reply.
export function CommentReplyList({
  parentId,
  targetType,
  targetId,
  canModerate,
}: {
  parentId: string;
  targetType: CommentTargetType;
  targetId: string;
  canModerate: boolean;
}) {
  const pager = useCursorPager();
  const query = useReplies(parentId, pager.cursor);
  const moderate = useModerateComment();
  const items = query.data?.comments.items ?? [];
  const nextCursor = query.data?.comments.nextCursor ?? null;

  if (query.isPending) {
    return (
      <p className="px-1 text-xs text-zinc-500 dark:text-zinc-400">
        Đang tải phản hồi…
      </p>
    );
  }
  if (query.isError) {
    return (
      <p role="alert" className="px-1 text-xs text-red-600 dark:text-red-400">
        Không tải được phản hồi.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 border-l-2 border-zinc-200 pl-3 dark:border-zinc-700">
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id}>
            <CommentCard
              item={item}
              actions={
                canModerate ? (
                  <button
                    type="button"
                    disabled={moderate.isPending}
                    onClick={() =>
                      moderate.mutate({
                        commentId: item.id,
                        action: item.hidden ? "unhide" : "hide",
                        targetType,
                        targetId,
                      })
                    }
                    className="flex min-h-[32px] items-center gap-1 rounded-lg px-2 text-[11px] font-medium text-zinc-500 transition-colors duration-200 hover:bg-zinc-100 hover:text-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  >
                    {item.hidden ? (
                      <FiEye aria-hidden="true" className="h-3.5 w-3.5" />
                    ) : (
                      <FiEyeOff aria-hidden="true" className="h-3.5 w-3.5" />
                    )}
                    {item.hidden ? "Hiện lại" : "Ẩn"}
                  </button>
                ) : undefined
              }
            />
          </li>
        ))}
      </ul>

      {(pager.canPrev || nextCursor) && (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            aria-label="Trang phản hồi trước"
            disabled={!pager.canPrev}
            onClick={pager.prev}
            className="flex min-h-[36px] items-center gap-1 rounded-lg border border-zinc-300 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <FiChevronLeft aria-hidden="true" className="h-3.5 w-3.5" />
            Trước
          </button>
          <button
            type="button"
            aria-label="Trang phản hồi sau"
            disabled={!nextCursor}
            onClick={() => pager.next(nextCursor)}
            className="flex min-h-[36px] items-center gap-1 rounded-lg border border-zinc-300 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Sau
            <FiChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
