"use client";

import { useEffect, useMemo, useRef } from "react";
import { FiLoader } from "react-icons/fi";
import { SCROLLBAR_CLASSES } from "@/components/ui/scrollbar";
import { useChatMessages, useChatThread, useMarkChatRead } from "@/hooks/chat";
import type { ChatMessage } from "@/lib/chat/chat.types";
import { ChatComposer } from "./ChatComposer";

type ChatConversationProps = {
  threadId: string;
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Bubble({ message }: { message: ChatMessage }) {
  return (
    <div className={`flex ${message.mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
          message.mine
            ? "rounded-br-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            : "rounded-bl-md bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
        <p
          className={`mt-1 text-right text-[10px] ${
            message.mine
              ? "text-zinc-300 dark:text-zinc-500"
              : "text-zinc-400 dark:text-zinc-500"
          }`}
        >
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

export function ChatConversation({ threadId }: ChatConversationProps) {
  const messages = useChatMessages(threadId, true);
  const detail = useChatThread(threadId, true);
  const markRead = useMarkChatRead(threadId);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Pages arrive newest-first; flatten + reverse once for display order.
  const items = useMemo(
    () => (messages.data?.pages ?? []).flatMap((page) => page.items).reverse(),
    [messages.data],
  );

  // Mark read whenever the visible tail changes and stick the scroll to
  // the bottom on new messages (Telegram-style tail follow). Loading older
  // pages changes the head, not the tail, so the view stays put.
  const lastItemId = items[items.length - 1]?.id;
  useEffect(() => {
    const node = scrollerRef.current;
    if (node) node.scrollTop = node.scrollHeight;
    if (lastItemId) markRead.mutate(threadId);
  }, [lastItemId, threadId, markRead.mutate]);

  const peerLastReadAt = detail.data?.peerLastReadAt ?? null;
  const lastSeenMineId = useMemo(() => {
    if (!peerLastReadAt) return null;
    const readAt = new Date(peerLastReadAt).getTime();
    let seen: string | null = null;
    for (const item of items) {
      if (item.mine && new Date(item.createdAt).getTime() <= readAt) {
        seen = item.id;
      }
    }
    return seen;
  }, [items, peerLastReadAt]);

  return (
    <div className="flex h-full flex-col">
      <div
        ref={scrollerRef}
        className={`flex-1 space-y-2 overflow-y-auto px-3 py-3 ${SCROLLBAR_CLASSES}`}
      >
        {messages.hasNextPage ? (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => void messages.fetchNextPage()}
              disabled={messages.isFetchingNextPage}
              className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              {messages.isFetchingNextPage ? "Đang tải..." : "Tải tin cũ hơn"}
            </button>
          </div>
        ) : null}
        {messages.isPending ? (
          <div className="flex h-full items-center justify-center text-zinc-500">
            <FiLoader className="h-5 w-5 animate-spin" aria-hidden />
          </div>
        ) : messages.isError ? (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {messages.error.message}
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <p className="text-sm text-zinc-400 dark:text-zinc-500">
              Chưa có tin nhắn. Gửi lời chào đầu tiên nhé!
            </p>
          </div>
        ) : (
          items.map((message) => (
            <div key={message.id}>
              <Bubble message={message} />
              {message.id === lastSeenMineId ? (
                <p className="mt-1 pr-1 text-right text-[10px] text-zinc-400 dark:text-zinc-500">
                  Đã xem
                </p>
              ) : null}
            </div>
          ))
        )}
      </div>
      <ChatComposer threadId={threadId} />
    </div>
  );
}
