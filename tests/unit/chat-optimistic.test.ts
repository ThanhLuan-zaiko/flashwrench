// Pure cache helpers behind the optimistic chat send: the bubble appears
// instantly, then reconciles with the persisted row. No mocks needed.
import { describe, expect, test } from "bun:test";
import type { ChatMessage } from "@/lib/chat/chat.types";
import {
  buildOptimisticMessage,
  type ChatMessagePageLike,
  insertOptimisticMessage,
  replaceOptimisticMessage,
} from "@/lib/chat/chat-optimistic";

function makeMessage(overrides?: Partial<ChatMessage>): ChatMessage {
  return {
    id: "msg-1",
    threadId: "thread-1",
    senderId: "user-1",
    kind: "text",
    body: "Hello",
    createdAt: "2026-10-03T10:00:00.000Z",
    mine: false,
    ...overrides,
  };
}

function makePage(
  ids: string[],
  nextCursor: string | null = null,
): ChatMessagePageLike {
  return {
    items: ids.map((id) => makeMessage({ id })),
    nextCursor,
  };
}

describe("buildOptimisticMessage", () => {
  test("echoes the draft as the sender's own row", () => {
    const message = buildOptimisticMessage({
      id: "temp-1",
      threadId: "thread-1",
      senderId: "user-1",
      kind: "image",
      body: "/api/media/misc/2026-10/a.webp",
      createdAt: "2026-10-03T10:01:00.000Z",
    });
    expect(message).toEqual({
      id: "temp-1",
      threadId: "thread-1",
      senderId: "user-1",
      kind: "image",
      body: "/api/media/misc/2026-10/a.webp",
      createdAt: "2026-10-03T10:01:00.000Z",
      mine: true,
    });
  });
});

describe("insertOptimisticMessage", () => {
  test("heads the newest page and keeps its cursor", () => {
    const pages = [makePage(["m2", "m1"], "cursor-1"), makePage(["m0"])];
    const result = insertOptimisticMessage(pages, makeMessage({ id: "temp" }));
    expect(result[0]?.items.map((item) => item.id)).toEqual([
      "temp",
      "m2",
      "m1",
    ]);
    expect(result[0]?.nextCursor).toBe("cursor-1");
    expect(result[1]?.items.map((item) => item.id)).toEqual(["m0"]);
  });

  test("grows the first page when the cache is empty", () => {
    const result = insertOptimisticMessage<ChatMessagePageLike>(
      [],
      makeMessage({ id: "temp" }),
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.items.map((item) => item.id)).toEqual(["temp"]);
    expect(result[0]?.nextCursor).toBeNull();
  });
});

describe("replaceOptimisticMessage", () => {
  test("swaps the temp row for the persisted row", () => {
    const pages = [makePage(["temp", "m1"])];
    const real = makeMessage({ id: "real-1", body: "Xin chào", mine: true });
    const result = replaceOptimisticMessage(pages, "temp", real);
    expect(result[0]?.items).toEqual([real, makeMessage({ id: "m1" })]);
  });

  test("drops the temp row when a refetch already carried the real row", () => {
    const real = makeMessage({ id: "real-1", mine: true });
    const pages = [
      { items: [makeMessage({ id: "temp" }), real], nextCursor: null },
    ];
    const result = replaceOptimisticMessage(pages, "temp", real);
    expect(result[0]?.items).toEqual([real]);
  });

  test("leaves pages without the temp row untouched", () => {
    const pages = [makePage(["m1"])];
    const result = replaceOptimisticMessage(
      pages,
      "missing",
      makeMessage({ id: "real-1", mine: true }),
    );
    expect(result).toEqual(pages);
  });
});
