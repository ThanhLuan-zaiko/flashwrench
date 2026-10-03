"use client";

import { FiLoader, FiMessageCircle } from "react-icons/fi";
import { useMe } from "@/hooks/auth";
import { useOpenChatThread } from "@/hooks/chat";
import { canUseChat } from "@/lib/chat/chat-visibility";
import { openChatPanel } from "./chat-launcher";

type ChatWithPeerButtonProps = {
  bookingId: string;
  label: string;
  className?: string;
};

// Booking-scoped entry point: resolves (or creates) the customer<->mechanic
// thread for this booking server-side, then opens the floating panel on it.
// Guests and non-chat roles get the locked panel instead of an API call.
export function ChatWithPeerButton({
  bookingId,
  label,
  className = "",
}: ChatWithPeerButtonProps) {
  const me = useMe();
  const isChatter = canUseChat(me.data?.role);
  const open = useOpenChatThread();
  if (!isChatter) {
    return (
      <button
        type="button"
        onClick={() => openChatPanel()}
        aria-label={label}
        className={`inline-flex items-center justify-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800 ${className}`}
      >
        <FiMessageCircle className="h-4 w-4" aria-hidden />
        {label}
      </button>
    );
  }
  return (
    <button
      type="button"
      disabled={open.isPending}
      onClick={() =>
        open.mutate(bookingId, {
          onSuccess: (thread) => openChatPanel(thread.id),
        })
      }
      title={open.isError ? open.error.message : undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800 ${className}`}
    >
      {open.isPending ? (
        <FiLoader className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <FiMessageCircle className="h-4 w-4" aria-hidden />
      )}
      {label}
    </button>
  );
}
