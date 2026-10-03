import type { ChatMessage, ChatMessageKind } from "./chat.types";

// Client-safe optimistic helpers for chat send. History pages are
// newest-first (see listThreadMessages), so the newest page is pages[0].
// The page shape is structural on purpose: both the fetch layer and the
// server service share it without pulling server modules into the client.
export type ChatMessagePageLike = {
  items: ChatMessage[];
  nextCursor: string | null;
};

export function buildOptimisticMessage(args: {
  id: string;
  threadId: string;
  senderId: string;
  kind: ChatMessageKind;
  body: string;
  createdAt: string;
}): ChatMessage {
  return {
    id: args.id,
    threadId: args.threadId,
    senderId: args.senderId,
    kind: args.kind,
    body: args.body,
    createdAt: args.createdAt,
    mine: true,
  };
}

// The new message is the newest row, so it goes to the head of pages[0].
// An empty cache grows its first page instead.
export function insertOptimisticMessage<T extends ChatMessagePageLike>(
  pages: T[],
  message: ChatMessage,
): T[] {
  const head = pages[0];
  if (!head) {
    return [{ items: [message], nextCursor: null } as T];
  }
  return [{ ...head, items: [message, ...head.items] }, ...pages.slice(1)];
}

// Swap the temp row for the persisted one. When a refetch already carried
// the real row, the temp row is dropped instead of duplicated.
export function replaceOptimisticMessage<T extends ChatMessagePageLike>(
  pages: T[],
  tempId: string,
  real: ChatMessage,
): T[] {
  const hasReal = pages.some((page) =>
    page.items.some((item) => item.id === real.id),
  );
  return pages.map((page) => {
    if (!page.items.some((item) => item.id === tempId)) return page;
    if (hasReal) {
      return {
        ...page,
        items: page.items.filter((item) => item.id !== tempId),
      };
    }
    return {
      ...page,
      items: page.items.map((item) => (item.id === tempId ? real : item)),
    };
  });
}
