"use client";

import { FiMessageCircle } from "react-icons/fi";
import { openChatPanel } from "@/components/chat/chat-launcher";

// The assigned mechanic: initial avatar, name and a shortcut into chat.
export function TrackMechanicCard({ name }: { name: string }) {
  const initial = name.trim().split(/\s+/).pop()?.charAt(0).toUpperCase() ?? "";
  return (
    <section
      aria-label="Thợ phụ trách"
      className="flex items-center gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800"
    >
      <span
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FB923C] text-sm font-bold text-[#111111] dark:bg-[#FB923C] dark:text-[#111111]"
      >
        {initial}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">
          {name}
        </span>
        <span className="truncate text-xs text-zinc-600 dark:text-zinc-400">
          Thợ phụ trách lịch hẹn của bạn
        </span>
      </span>
      <button
        type="button"
        onClick={() => openChatPanel()}
        aria-label="Nhắn tin với cửa hàng"
        className="flex min-h-11 shrink-0 items-center gap-1.5 text-sm font-bold text-[#1D4ED8] underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] dark:text-blue-300"
      >
        <FiMessageCircle aria-hidden="true" className="h-4 w-4" />
        Nhắn tin
      </button>
    </section>
  );
}
