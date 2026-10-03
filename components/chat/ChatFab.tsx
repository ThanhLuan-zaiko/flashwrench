"use client";

import { useCallback, useEffect, useState } from "react";
import { FiMessageCircle, FiX } from "react-icons/fi";
import { useMe } from "@/hooks/auth";
import { useChatThreads } from "@/hooks/chat";
import { useChatRealtime } from "@/hooks/useChatRealtime";
import { canUseChat } from "@/lib/chat/chat-visibility";
import { ChatPanel } from "./ChatPanel";
import { registerChatLauncher } from "./chat-launcher";
import { CHAT_FAB_CLASSES } from "./chat-overlay.classes";

// Floating launcher for the internal chat — always visible so guests can
// discover the channel, but the inbox stays locked until sign-in. Booking
// screens trigger it through `openChatPanel`.
export function ChatFab() {
  const me = useMe();
  const user = me.data;
  const isChatter = canUseChat(user?.role);
  const [open, setOpen] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  useChatRealtime(isChatter && user ? user.id : null);
  const threads = useChatThreads(isChatter);
  const unreadThreads = isChatter
    ? (threads.data?.pages[threads.data.pages.length - 1]?.unreadThreads ?? 0)
    : 0;

  useEffect(() => {
    return registerChatLauncher((threadId) => {
      setActiveThreadId(threadId ?? null);
      setOpen(true);
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const selectThread = useCallback((threadId: string | null) => {
    setActiveThreadId(threadId);
  }, []);

  return (
    <>
      {open ? (
        <ChatPanel
          activeThreadId={isChatter ? activeThreadId : null}
          isLocked={!isChatter}
          onSelectThread={selectThread}
          onClose={() => setOpen(false)}
        />
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Đóng hộp thư" : "Mở hộp thư"}
        className={CHAT_FAB_CLASSES}
      >
        {open ? (
          <FiX className="h-6 w-6" aria-hidden />
        ) : (
          <FiMessageCircle className="h-6 w-6" aria-hidden />
        )}
        {!open && unreadThreads > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[11px] font-semibold leading-none text-white dark:border-zinc-950">
            {unreadThreads > 99 ? "99+" : unreadThreads}
          </span>
        ) : null}
      </button>
    </>
  );
}
