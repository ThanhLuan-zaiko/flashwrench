"use client";

import { type FormEvent, useState } from "react";
import { FiSend } from "react-icons/fi";
import { useSendChatMessage } from "@/hooks/chat";

const MAX_BODY_LENGTH = 2000;

export function ChatComposer({ threadId }: { threadId: string }) {
  const [body, setBody] = useState("");
  const send = useSendChatMessage(threadId);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = body.trim();
    if (!text || send.isPending) return;
    send.mutate(text, { onSuccess: () => setBody("") });
  };

  return (
    <form
      onSubmit={submit}
      className="flex shrink-0 items-end gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800"
    >
      <textarea
        value={body}
        onChange={(event) =>
          setBody(event.target.value.slice(0, MAX_BODY_LENGTH))
        }
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            submit(event);
          }
        }}
        rows={1}
        maxLength={MAX_BODY_LENGTH}
        placeholder="Nhập tin nhắn..."
        aria-label="Nội dung tin nhắn"
        className="max-h-28 min-h-10 flex-1 resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500"
      />
      <button
        type="submit"
        disabled={!body.trim() || send.isPending}
        aria-label="Gửi tin nhắn"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white transition-transform duration-150 enabled:hover:scale-105 enabled:active:scale-95 disabled:opacity-40 motion-safe:transition-transform dark:bg-zinc-100 dark:text-zinc-900"
      >
        <FiSend className="h-4 w-4" aria-hidden />
      </button>
    </form>
  );
}
