"use client";

import { FiLoader, FiMessageCircle } from "react-icons/fi";
import { useOpenChatThread } from "@/hooks/chat";
import { openChatPanel } from "./chat-launcher";

type ChatWithPeerButtonProps = {
  bookingId: string;
  label: string;
  className?: string;
};

// Booking-scoped entry point: resolves (or creates) the customer<->mechanic
// thread for this booking server-side, then opens the floating panel on it.
export function ChatWithPeerButton({
  bookingId,
  label,
  className = "",
}: ChatWithPeerButtonProps) {
  const open = useOpenChatThread();
  return (
    <button
      type="button"
      disabled={open.isPending}
      onClick={() =>
        open.mutate(bookingId, {
          onSuccess: (thread) => openChatPanel(thread.id),
        })
      }
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800 ${className}`}
    >
      {open.isPending ? (
        <FiLoader className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <FiMessageCircle className="h-4 w-4" aria-hidden />
      )}
      {open.isError ? open.error.message : label}
    </button>
  );
}
