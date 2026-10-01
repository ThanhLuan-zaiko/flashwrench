// Shared repository/realtime stubs for the chat suites. Same pattern as
// the voucher stubs: tests mutate `chatStubs` and assert on mock.calls.
// Nothing here touches a real database or socket.
import { mock } from "bun:test";
import type { UserRow } from "@/lib/auth/user.types";
import type {
  InsertMessageParams,
  InsertThreadParams,
  MessagePage,
  UpsertInboxParams,
} from "@/lib/chat/chat.repository";
import type { InboxRow, MessageRow, ThreadRow } from "@/lib/chat/chat.types";

export const chatStubs = {
  threadById: null as ThreadRow | null,
  pairThreadId: null as string | null,
  inboxByUser: new Map<string, InboxRow>(),
  inboxRows: [] as InboxRow[],
  unreadSenders: [] as string[],
  messagePage: { rows: [], pageState: null } as MessagePage,
  usersById: new Map<string, UserRow>(),
  insertedThreads: [] as InsertThreadParams[],
  insertedMessages: [] as InsertMessageParams[],
  upsertedInbox: [] as UpsertInboxParams[],
  readMarks: [] as { userId: string; threadId: string; readAt: Date }[],
  publishedMessages: [] as {
    threadId: string;
    messageId: string;
    senderId: string;
    recipientIds: string[];
  }[],
  publishedReads: [] as {
    threadId: string;
    readerId: string;
    recipientIds: string[];
  }[],
};

function inboxKey(userId: string, threadId: string): string {
  return `${userId}:${threadId}`;
}

export const chatRepoMocks = {
  findThreadRowById: mock(
    async (_threadId: string): Promise<ThreadRow | null> =>
      chatStubs.threadById,
  ),
  findThreadIdByPair: mock(
    async (_customerId: string, _mechanicId: string): Promise<string | null> =>
      chatStubs.pairThreadId,
  ),
  insertThread: mock(async (params: InsertThreadParams): Promise<void> => {
    chatStubs.insertedThreads.push(params);
  }),
  upsertInboxRow: mock(async (params: UpsertInboxParams): Promise<void> => {
    chatStubs.upsertedInbox.push(params);
    // Keep the fake store coherent so membership reads see the write.
    const existing = chatStubs.inboxByUser.get(
      inboxKey(params.userId, params.threadId),
    );
    const row: InboxRow = {
      user_id: params.userId,
      thread_id: params.threadId,
      peer_id: params.peerId,
      peer_name: params.peerName,
      peer_role: params.peerRole,
      peer_avatar_url: params.peerAvatarUrl,
      last_message_at: params.lastMessageAt,
      last_message_preview: params.lastMessagePreview,
      last_message_sender: params.lastMessageSender,
      last_read_at: existing?.last_read_at ?? null,
      created_at: params.createdAt,
    };
    chatStubs.inboxByUser.set(inboxKey(params.userId, params.threadId), row);
    const idx = chatStubs.inboxRows.findIndex(
      (item) =>
        item.user_id === params.userId && item.thread_id === params.threadId,
    );
    if (idx >= 0) chatStubs.inboxRows[idx] = row;
    else chatStubs.inboxRows.push(row);
  }),
  findInboxRow: mock(
    async (userId: string, threadId: string): Promise<InboxRow | null> =>
      chatStubs.inboxByUser.get(inboxKey(userId, threadId)) ?? null,
  ),
  listInboxRows: mock(
    async (userId: string): Promise<InboxRow[]> =>
      chatStubs.inboxRows.filter((row) => row.user_id === userId),
  ),
  markInboxRead: mock(
    async (userId: string, threadId: string, readAt: Date): Promise<void> => {
      chatStubs.readMarks.push({ userId, threadId, readAt });
      const row = chatStubs.inboxByUser.get(inboxKey(userId, threadId));
      if (row)
        chatStubs.inboxByUser.set(inboxKey(userId, threadId), {
          ...row,
          last_read_at: readAt,
        });
    },
  ),
  insertMessage: mock(async (params: InsertMessageParams): Promise<void> => {
    chatStubs.insertedMessages.push(params);
  }),
  listMessageRows: mock(
    async (
      _threadId: string,
      _limit: number,
      _pageState?: string | null,
    ): Promise<MessagePage> => chatStubs.messagePage,
  ),
  listUnreadSenders: mock(
    async (_threadId: string, _since: Date | null): Promise<string[]> =>
      chatStubs.unreadSenders,
  ),
  updateThreadSnapshot: mock(
    async (
      _threadId: string,
      _at: Date,
      _preview: string,
      _senderId: string,
    ): Promise<void> => undefined,
  ),
};

export const chatUserRepoMocks = {
  findUserById: mock(
    async (userId: string): Promise<UserRow | null> =>
      chatStubs.usersById.get(userId) ?? null,
  ),
};

export const chatRealtimeMocks = {
  publishChatMessage: mock(
    async (args: {
      threadId: string;
      messageId: string;
      senderId: string;
      recipientIds: string[];
    }): Promise<void> => {
      chatStubs.publishedMessages.push(args);
    },
  ),
  publishChatRead: mock(
    async (args: {
      threadId: string;
      readerId: string;
      recipientIds: string[];
    }): Promise<void> => {
      chatStubs.publishedReads.push(args);
    },
  ),
};

export function makeInboxRow(overrides?: Partial<InboxRow>): InboxRow {
  return {
    user_id: "user-1",
    thread_id: "thread-1",
    peer_id: "peer-1",
    peer_name: "Peer",
    peer_role: "mechanic",
    peer_avatar_url: null,
    last_message_at: null,
    last_message_preview: null,
    last_message_sender: null,
    last_read_at: null,
    created_at: new Date("2026-09-16T08:00:00.000Z"),
    ...overrides,
  };
}

export function makeMessageRow(overrides?: Partial<MessageRow>): MessageRow {
  return {
    thread_id: "thread-1",
    created_at: new Date("2026-09-16T09:00:00.000Z"),
    message_id: "msg-1",
    sender_id: "peer-1",
    kind: "text",
    body: "Xin chao",
    ...overrides,
  };
}

export function resetChatMocks(): void {
  chatStubs.threadById = null;
  chatStubs.pairThreadId = null;
  chatStubs.inboxByUser = new Map();
  chatStubs.inboxRows = [];
  chatStubs.unreadSenders = [];
  chatStubs.messagePage = { rows: [], pageState: null };
  chatStubs.usersById = new Map();
  chatStubs.insertedThreads = [];
  chatStubs.insertedMessages = [];
  chatStubs.upsertedInbox = [];
  chatStubs.readMarks = [];
  chatStubs.publishedMessages = [];
  chatStubs.publishedReads = [];
  for (const fn of Object.values(chatRepoMocks)) fn.mockClear();
  for (const fn of Object.values(chatUserRepoMocks)) fn.mockClear();
  for (const fn of Object.values(chatRealtimeMocks)) fn.mockClear();
}
