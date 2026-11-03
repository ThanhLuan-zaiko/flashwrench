"use client";

import { useMe } from "@/hooks/auth";
import { useSendChatMessage } from "@/hooks/chat";
import { getChatQuickReplies } from "@/lib/chat/chat-quick-replies";

// One-tap canned replies pinned above the composer. Tapping sends
// immediately through the shared optimistic mutation so roadside users
// never type the same status question twice.
export function ChatQuickReplies({ threadId }: { threadId: string }) {
  const me = useMe();
  const send = useSendChatMessage(threadId);
  const replies = getChatQuickReplies(me.data?.role);
  if (replies.length === 0) return null;

  return (
    <div className="shrink-0 border-t border-zinc-200 px-3 pt-2 dark:border-zinc-800">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {replies.map((reply) => (
          <button
            key={reply}
            type="button"
            disabled={send.isPending}
            onClick={() => {
              if (!send.isPending) send.mutate({ body: reply, kind: "text" });
            }}
            className="min-h-11 shrink-0 whitespace-nowrap rounded-full border border-green-700 px-3 text-xs font-medium text-green-800 transition-transform duration-150 enabled:hover:scale-105 enabled:active:scale-95 disabled:opacity-40 motion-safe:transition-transform dark:border-green-500 dark:text-green-400"
          >
            {reply}
          </button>
        ))}
      </div>
    </div>
  );
}
