"use client";

import { useEffect, useMemo, useRef } from "react";
import { FiLoader } from "react-icons/fi";
import { SCROLLBAR_CLASSES } from "@/components/ui/scrollbar";
import { useChatMessages, useChatThread, useMarkChatRead } from "@/hooks/chat";
import { ChatComposer } from "./ChatComposer";
import { ChatMessageBubble } from "./ChatMessageBubble";

type ChatConversationProps = {
  threadId: string;
};

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
              <ChatMessageBubble message={message} />
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
