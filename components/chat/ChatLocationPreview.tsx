"use client";

import type { ChatLocation } from "@/lib/chat/chat-content";
import { chatLocationEmbedUrl } from "@/lib/chat/chat-map";

// Lightweight location preview: a static OSM iframe keeps long threads
// fast (no Leaflet bundle per bubble) and renders on the server.
export function ChatLocationPreview({ point }: { point: ChatLocation }) {
  return (
    <span className="mt-2 block overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
      <iframe
        title="Xem trước vị trí đã chia sẻ"
        src={chatLocationEmbedUrl(point)}
        loading="lazy"
        className="h-36 w-full border-0"
      />
    </span>
  );
}
