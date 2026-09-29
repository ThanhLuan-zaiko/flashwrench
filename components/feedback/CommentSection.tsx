"use client";

import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useAccountSession } from "@/hooks/auth";
import { useAddComment, useComments } from "@/hooks/comments";
import { useCursorPager } from "@/hooks/useCursorPager";
import type { CommentTargetType } from "@/services/comments.api";
import { AuthApiError } from "@/services/comments.api";
import { CommentComposer } from "./CommentComposer";
import { CommentItem } from "./CommentItem";

// One comment thread per entity. The composer appears only for signed-in
// users; private threads are enforced server-side per target type.
// Admin/dispatcher sessions additionally see hidden rows and hide/unhide
// controls; everyone gets one level of replies.
export function CommentSection({
  targetType,
  targetId,
  title = "Bình luận",
}: {
  targetType: CommentTargetType;
  targetId: string | null;
  title?: string;
}) {
  const session = useAccountSession();
  const pager = useCursorPager();
  const query = useComments(targetType, targetId, pager.cursor);
  const add = useAddComment(targetType, targetId ?? "");

  const page = query.data?.comments;
  const items = page?.items ?? [];
  const user = session.data?.user;
  const signedIn = Boolean(user);
  const canModerate = Boolean(
    user && ["admin", "dispatcher"].includes(user.role),
  );

  const errorMessage =
    add.error instanceof AuthApiError
      ? ((add.error.errors as Record<string, string>).form ??
        (add.error.errors as Record<string, string>).body ??
        null)
      : add.isError
        ? "Không gửi được bình luận. Vui lòng thử lại."
        : null;

  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        {title}
      </p>

      {query.isPending && targetId && (
        <p
          aria-busy="true"
          className="text-xs text-zinc-500 dark:text-zinc-400"
        >
          Đang tải bình luận…
        </p>
      )}
      {query.isError && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          Không tải được bình luận.
        </p>
      )}

      {items.length === 0 && !query.isPending ? (
        <p className="rounded-xl border border-zinc-200 p-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Chưa có bình luận nào.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <CommentItem
              key={item.id}
              item={item}
              targetType={targetType}
              targetId={targetId ?? ""}
              signedIn={signedIn}
              canModerate={canModerate}
            />
          ))}
        </ul>
      )}

      {(pager.canPrev || page?.nextCursor) && (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            aria-label="Trang trước"
            disabled={!pager.canPrev}
            onClick={pager.prev}
            className="flex min-h-[44px] items-center gap-1 rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <FiChevronLeft aria-hidden="true" className="h-4 w-4" />
            Trước
          </button>
          <button
            type="button"
            aria-label="Trang sau"
            disabled={!page?.nextCursor}
            onClick={() => pager.next(page?.nextCursor ?? null)}
            className="flex min-h-[44px] items-center gap-1 rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Sau
            <FiChevronRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      )}

      {signedIn ? (
        <CommentComposer
          id={`comment-${targetType}-${targetId}`}
          pending={add.isPending}
          error={errorMessage}
          onSubmit={(body) =>
            add.mutate({ body }, { onSuccess: () => pager.reset() })
          }
        />
      ) : (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Đăng nhập để tham gia bình luận.
        </p>
      )}
    </section>
  );
}
