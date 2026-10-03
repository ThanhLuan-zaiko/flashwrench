"use client";

import { type FormEvent, useRef, useState } from "react";
import { FiImage, FiLoader, FiMapPin, FiSend } from "react-icons/fi";
import { useSendChatMessage } from "@/hooks/chat";
import {
  useSendChatImage,
  useSendChatLocation,
} from "@/hooks/chat-attachments";

const MAX_BODY_LENGTH = 2000;
const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";

const ATTACH_BUTTON_CLASSES =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 transition-transform duration-150 enabled:hover:scale-105 enabled:active:scale-95 disabled:opacity-40 motion-safe:transition-transform dark:border-zinc-700 dark:text-zinc-300";

export function ChatComposer({ threadId }: { threadId: string }) {
  const [body, setBody] = useState("");
  const send = useSendChatMessage(threadId);
  const image = useSendChatImage(threadId);
  const location = useSendChatLocation(threadId);
  const fileRef = useRef<HTMLInputElement>(null);

  const busy = send.isPending || image.uploading || location.locating;
  const alert = send.isError
    ? send.error.message
    : (image.error ?? location.error);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = body.trim();
    if (!text || busy) return;
    setBody("");
    send.mutate({ body: text, kind: "text" }, { onError: () => setBody(text) });
  };

  return (
    <div className="shrink-0 border-t border-zinc-200 px-3 pb-3 pt-2 dark:border-zinc-800">
      {alert ? (
        <p
          role="alert"
          className="mb-2 px-1 text-xs text-red-600 dark:text-red-400"
        >
          {alert}
        </p>
      ) : null}
      <form onSubmit={submit} className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          aria-label="Gửi ảnh"
          className={ATTACH_BUTTON_CLASSES}
        >
          {image.uploading ? (
            <FiLoader className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <FiImage className="h-4 w-4" aria-hidden />
          )}
        </button>
        <button
          type="button"
          onClick={() => location.sendLocation()}
          disabled={busy}
          aria-label="Chia sẻ vị trí hiện tại"
          className={ATTACH_BUTTON_CLASSES}
        >
          {location.locating ? (
            <FiLoader className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <FiMapPin className="h-4 w-4" aria-hidden />
          )}
        </button>
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
          disabled={!body.trim() || busy}
          aria-label="Gửi tin nhắn"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white transition-transform duration-150 enabled:hover:scale-105 enabled:active:scale-95 disabled:opacity-40 motion-safe:transition-transform dark:bg-zinc-100 dark:text-zinc-900"
        >
          <FiSend className="h-4 w-4" aria-hidden />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={IMAGE_ACCEPT}
          tabIndex={-1}
          aria-hidden="true"
          className="hidden"
          onChange={(event) => {
            void image.sendImage(event.target.files?.[0] ?? null);
            event.target.value = "";
          }}
        />
      </form>
    </div>
  );
}
