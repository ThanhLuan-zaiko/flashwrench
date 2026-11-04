"use client";

import Link from "next/link";
import { FiInbox, FiLoader } from "react-icons/fi";
import { SCROLLBAR_CLASSES } from "@/components/ui/scrollbar";
import { useChatThreads } from "@/hooks/chat";
import type { ChatThreadSummary } from "@/lib/chat/chat.types";
import { getChatEmptyActions } from "@/lib/chat/chat-visibility";

type ChatThreadListProps = {
  onSelect: (threadId: string) => void;
  enabled?: boolean;
};

const EMPTY_ACTIONS = getChatEmptyActions();

function formatStamp(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
}

function ThreadRow({
  thread,
  onSelect,
}: {
  thread: ChatThreadSummary;
  onSelect: (threadId: string) => void;
}) {
  const initial = (thread.peerName.trim()[0] ?? "?").toUpperCase();
  return (
    <button
      type="button"
      onClick={() => onSelect(thread.id)}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
    >
      {thread.peerAvatarUrl ? (
        // biome-ignore lint/performance/noImgElement: dynamic avatar served immutable; optimizer hop adds nothing.
        <img
          src={thread.peerAvatarUrl}
          alt=""
          className="h-11 w-11 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200">
          {initial}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {thread.peerName}
          </span>
          <span className="shrink-0 text-xs text-zinc-600 dark:text-zinc-400">
            {formatStamp(thread.lastMessageAt)}
          </span>
        </span>
        <span className="mt-0.5 flex items-center justify-between gap-2">
          <span className="truncate text-xs text-zinc-600 dark:text-zinc-400">
            {thread.lastMessagePreview || "Bắt đầu cuộc trò chuyện"}
          </span>
          {thread.unreadCount > 0 ? (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#FB923C] px-1.5 text-xs font-semibold text-[#111111] dark:bg-[#FB923C] dark:text-[#111111]">
              {thread.unreadCount > 99 ? "99+" : thread.unreadCount}
            </span>
          ) : null}
        </span>
      </span>
    </button>
  );
}

export function ChatThreadList({
  onSelect,
  enabled = true,
}: ChatThreadListProps) {
  const query = useChatThreads(enabled);
  const pages = query.data?.pages ?? [];
  const threads = pages.flatMap((page) => page.items);

  if (query.isPending) {
    return (
      <div className="flex h-full items-center justify-center text-zinc-600 dark:text-zinc-400">
        <FiLoader className="h-5 w-5 animate-spin" aria-hidden />
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {query.error.message}
        </p>
        <button
          type="button"
          onClick={() => void query.refetch()}
          className="text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
        >
          Thử lại
        </button>
      </div>
    );
  }
  if (threads.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <FiInbox
          className="h-8 w-8 text-zinc-300 dark:text-zinc-400"
          aria-hidden
        />
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Chưa có cuộc trò chuyện nào. Mở một đơn hàng và nhấn &quot;Nhắn
          tin&quot; để bắt đầu.
        </p>
        <div className="flex items-center gap-2">
          {EMPTY_ACTIONS.map((action, index) => (
            <Link
              key={action.href}
              href={action.href}
              className={
                index === 0
                  ? "rounded-full bg-[#1D4ED8] px-4 py-2 text-xs font-medium text-white dark:bg-[#60A5FA] dark:text-[#111111] transition-transform duration-150 hover:scale-105 active:scale-95 motion-safe:transition-transform dark:bg-[#FB923C] dark:text-[#111111]"
                  : "rounded-full border border-zinc-500 px-4 py-2 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-zinc-500 dark:text-zinc-200 dark:hover:bg-zinc-800"
              }
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div
      className={`flex h-full flex-col overflow-y-auto ${SCROLLBAR_CLASSES}`}
    >
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {threads.map((thread) => (
          <ThreadRow key={thread.id} thread={thread} onSelect={onSelect} />
        ))}
      </div>
      {query.hasNextPage ? (
        <button
          type="button"
          onClick={() => void query.fetchNextPage()}
          disabled={query.isFetchingNextPage}
          className="mx-auto my-3 rounded-full border border-zinc-500 px-4 py-2 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-500 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {query.isFetchingNextPage ? "Đang tải..." : "Tải thêm"}
        </button>
      ) : null}
    </div>
  );
}
