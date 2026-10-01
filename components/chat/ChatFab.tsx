"use client";

import { useCallback, useEffect, useState } from "react";
import { FiMessageCircle, FiX } from "react-icons/fi";
import { useMe } from "@/hooks/auth";
import { useChatThreads } from "@/hooks/chat";
import { useChatRealtime } from "@/hooks/useChatRealtime";
import { ChatPanel } from "./ChatPanel";
import { registerChatLauncher } from "./chat-launcher";

// Floating launcher for the internal chat — renders only for logged-in
// customers and mechanics, and doubles as the app-wide open handler that
// booking screens trigger through `openChatPanel`.
export function ChatFab() {
  const me = useMe();
  const user = me.data;
  const isChatter = user?.role === "customer" || user?.role === "mechanic";
  const [open, setOpen] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  useChatRealtime(isChatter ? user.id : null);
  const threads = useChatThreads(isChatter);
  const unreadThreads =
    threads.data?.pages[threads.data.pages.length - 1]?.unreadThreads ?? 0;

  useEffect(() => {
    if (!isChatter) return;
    return registerChatLauncher((threadId) => {
      setActiveThreadId(threadId ?? null);
      setOpen(true);
    });
  }, [isChatter]);

  const selectThread = useCallback((threadId: string | null) => {
    setActiveThreadId(threadId);
  }, []);

  if (!isChatter) return null;

  return (
    <>
      {open ? (
        <ChatPanel
          activeThreadId={activeThreadId}
          onSelectThread={selectThread}
          onClose={() => setOpen(false)}
        />
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Đóng hộp thư" : "Mở hộp thư"}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95 motion-safe:transition-transform dark:bg-zinc-100 dark:text-zinc-900"
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
