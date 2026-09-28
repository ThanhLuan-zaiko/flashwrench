"use client";

import { useState } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiLoader,
  FiSend,
} from "react-icons/fi";
import { useAccountSession } from "@/hooks/auth";
import { useAddComment, useComments } from "@/hooks/comments";
import { formatDateTime } from "@/lib/datetime/format";
import type { CommentTargetType } from "@/services/comments.api";
import { AuthApiError } from "@/services/comments.api";

// One comment thread per entity. The composer appears only for signed-in
// users; private threads are enforced server-side per target type.
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
  const [cursor, setCursor] = useState<string | null>(null);
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([]);
  const [body, setBody] = useState("");
  const query = useComments(targetType, targetId, cursor);
  const add = useAddComment(targetType, targetId ?? "");

  const page = query.data?.comments;
  const items = page?.items ?? [];
  const signedIn = Boolean(session.data?.user);

  const submit = () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    add.mutate(trimmed, {
      onSuccess: () => {
        setBody("");
        setCursor(null);
        setCursorStack([]);
      },
    });
  };

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
            <li
              key={item.id}
              className={`rounded-xl border px-3 py-2 ${
                item.staff
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
                  <span className="text-zinc-400 dark:text-zinc-500">
                    (Bạn)
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
            </li>
          ))}
        </ul>
      )}

      {(cursorStack.length > 0 || page?.nextCursor) && (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            aria-label="Trang trước"
            disabled={cursorStack.length === 0}
            onClick={() => {
              const stack = [...cursorStack];
              stack.pop();
              setCursorStack(stack);
              setCursor(stack[stack.length - 1] ?? null);
            }}
            className="flex min-h-[44px] items-center gap-1 rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <FiChevronLeft aria-hidden="true" className="h-4 w-4" />
            Trước
          </button>
          <button
            type="button"
            aria-label="Trang sau"
            disabled={!page?.nextCursor}
            onClick={() => {
              setCursorStack((stack) => [...stack, cursor]);
              setCursor(page?.nextCursor ?? null);
            }}
            className="flex min-h-[44px] items-center gap-1 rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Sau
            <FiChevronRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      )}

      {signedIn ? (
        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <label
            className="sr-only"
            htmlFor={`comment-${targetType}-${targetId}`}
          >
            Viết bình luận
          </label>
          <textarea
            id={`comment-${targetType}-${targetId}`}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={1000}
            rows={2}
            placeholder="Viết bình luận…"
            className="w-full resize-none rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
          {errorMessage && (
            <p
              role="alert"
              className="text-xs font-medium text-red-600 dark:text-red-400"
            >
              {errorMessage}
            </p>
          )}
          <button
            type="submit"
            disabled={add.isPending || !body.trim()}
            className="flex min-h-[44px] items-center justify-center gap-1.5 self-start rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {add.isPending ? (
              <FiLoader
                aria-hidden="true"
                className="h-4 w-4 motion-safe:animate-spin"
              />
            ) : (
              <FiSend aria-hidden="true" className="h-4 w-4" />
            )}
            Gửi bình luận
          </button>
        </form>
      ) : (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Đăng nhập để tham gia bình luận.
        </p>
      )}
    </section>
  );
}
