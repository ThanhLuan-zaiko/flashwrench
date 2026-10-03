"use client";

import { FiArrowLeft, FiX } from "react-icons/fi";
import { useChatThread } from "@/hooks/chat";
import { ChatConversation } from "./ChatConversation";
import { ChatLockedPanel } from "./ChatLockedPanel";
import { ChatThreadList } from "./ChatThreadList";
import { CHAT_PANEL_CLASSES } from "./chat-overlay.classes";

type ChatPanelProps = {
  activeThreadId: string | null;
  isLocked: boolean;
  onSelectThread: (threadId: string | null) => void;
  onClose: () => void;
};

// Telegram-mini style sheet: thread list on the left view, tapping a row
// swaps to the conversation view without leaving the page. Locked visitors
// (guests and non-chat roles) see a sign-in prompt and trigger no queries.
export function ChatPanel({
  activeThreadId,
  isLocked,
  onSelectThread,
  onClose,
}: ChatPanelProps) {
  const detail = useChatThread(
    activeThreadId,
    !isLocked && activeThreadId !== null,
  );
  const peerName = detail.data?.peerName ?? "";
  const showConversation = !isLocked && activeThreadId !== null;

  return (
    <div role="dialog" aria-label="Hộp thư" className={CHAT_PANEL_CLASSES}>
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-zinc-200 px-3 dark:border-zinc-800">
        {showConversation ? (
          <button
            type="button"
            onClick={() => onSelectThread(null)}
            aria-label="Quay lại danh sách"
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <FiArrowLeft className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {showConversation ? peerName || "Cuộc trò chuyện" : "Tin nhắn"}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {isLocked
              ? "Cần đăng nhập"
              : showConversation
                ? "Đang trò chuyện"
                : "Khách hàng ↔ thợ"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng hộp thư"
          className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <FiX className="h-5 w-5" aria-hidden />
        </button>
      </div>
      <div className="min-h-0 flex-1">
        {isLocked ? (
          <ChatLockedPanel />
        ) : activeThreadId ? (
          <ChatConversation threadId={activeThreadId} />
        ) : (
          <ChatThreadList onSelect={onSelectThread} enabled={!isLocked} />
        )}
      </div>
    </div>
  );
}
