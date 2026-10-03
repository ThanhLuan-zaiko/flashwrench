"use client";

import type { ReactNode } from "react";
import { FiMapPin } from "react-icons/fi";
import type { ChatMessage } from "@/lib/chat/chat.types";
import { chatLocationMapUrl, parseChatLocation } from "@/lib/chat/chat-content";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeClass(mine: boolean): string {
  return mine
    ? "text-zinc-300 dark:text-zinc-500"
    : "text-zinc-400 dark:text-zinc-500";
}

function BubbleShell({
  mine,
  children,
}: {
  mine: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
          mine
            ? "rounded-br-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            : "rounded-bl-md bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function TextBody({ message }: { message: ChatMessage }) {
  return (
    <BubbleShell mine={message.mine}>
      <p className="whitespace-pre-wrap break-words">{message.body}</p>
      <p className={`mt-1 text-right text-[10px] ${timeClass(message.mine)}`}>
        {formatTime(message.createdAt)}
      </p>
    </BubbleShell>
  );
}

function ImageBody({ message }: { message: ChatMessage }) {
  return (
    <BubbleShell mine={message.mine}>
      <a
        href={message.body}
        target="_blank"
        rel="noreferrer"
        aria-label="Mở ảnh gốc"
        className="block"
      >
        {/* biome-ignore lint/performance/noImgElement: immutable /api/media chat upload; optimizer hop adds nothing. */}
        <img
          src={message.body}
          alt="Ảnh trong cuộc trò chuyện"
          className="max-h-64 w-full rounded-xl object-cover"
        />
      </a>
      <p className={`mt-1 text-right text-[10px] ${timeClass(message.mine)}`}>
        {formatTime(message.createdAt)}
      </p>
    </BubbleShell>
  );
}

function LocationBody({ message }: { message: ChatMessage }) {
  const point = parseChatLocation(message.body);
  return (
    <BubbleShell mine={message.mine}>
      <span className="flex items-center gap-1.5 font-medium">
        <FiMapPin className="h-4 w-4 shrink-0" aria-hidden />
        Vị trí đã chia sẻ
      </span>
      {point ? (
        <span className="mt-0.5 block text-xs opacity-80">
          {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
        </span>
      ) : null}
      {point ? (
        <a
          href={chatLocationMapUrl(point)}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-block text-xs font-medium underline underline-offset-2"
        >
          Mở bản đồ
        </a>
      ) : null}
      <p className={`mt-1 text-right text-[10px] ${timeClass(message.mine)}`}>
        {formatTime(message.createdAt)}
      </p>
    </BubbleShell>
  );
}

export function ChatMessageBubble({ message }: { message: ChatMessage }) {
  if (message.kind === "image") return <ImageBody message={message} />;
  if (message.kind === "location") return <LocationBody message={message} />;
  return <TextBody message={message} />;
}
