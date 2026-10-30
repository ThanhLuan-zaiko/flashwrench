"use client";

import { FiMessageCircle } from "react-icons/fi";
import { openChatPanel } from "@/components/chat/chat-launcher";

// The assigned mechanic: initial avatar, name and a shortcut into chat.
export function TrackMechanicCard({ name }: { name: string }) {
  const initial = name.trim().split(/\s+/).pop()?.charAt(0).toUpperCase() ?? "";
  return (
    <section
      aria-label="Thợ phụ trách"
      className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <span
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1E3A5F] text-sm font-bold text-white dark:bg-zinc-100 dark:text-zinc-900"
      >
        {initial}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">
          {name}
        </span>
        <span className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
          Thợ phụ trách lịch hẹn của bạn
        </span>
      </span>
      <button
        type="button"
        onClick={() => openChatPanel()}
        aria-label="Nhắn tin với cửa hàng"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-300 text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        <FiMessageCircle aria-hidden="true" className="h-4 w-4" />
      </button>
    </section>
  );
}
