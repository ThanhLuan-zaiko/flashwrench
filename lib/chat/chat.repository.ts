// Raw CQL for the internal chat. No business logic here.
import { scylla } from "@/lib/db/client";
import type { InboxRow, MessageRow, ThreadRow } from "./chat.types";

const THREAD_COLUMNS =
  "thread_id, customer_id, mechanic_id, created_at, last_message_at, last_message_preview, last_message_sender";

const INBOX_COLUMNS =
  "user_id, thread_id, peer_id, peer_name, peer_role, peer_avatar_url, last_message_at, last_message_preview, last_message_sender, last_read_at, created_at";

const MESSAGE_COLUMNS =
  "thread_id, created_at, message_id, sender_id, kind, body";

function toThreadRow(raw: Record<string, unknown>): ThreadRow {
  return {
    thread_id: String(raw.thread_id),
    customer_id: raw.customer_id ? String(raw.customer_id) : null,
    mechanic_id: raw.mechanic_id ? String(raw.mechanic_id) : null,
    created_at: (raw.created_at as Date | null) ?? null,
    last_message_at: (raw.last_message_at as Date | null) ?? null,
    last_message_preview: (raw.last_message_preview as string | null) ?? null,
    last_message_sender: raw.last_message_sender
      ? String(raw.last_message_sender)
      : null,
  };
}

function toInboxRow(raw: Record<string, unknown>): InboxRow {
  return {
    user_id: String(raw.user_id),
    thread_id: String(raw.thread_id),
    peer_id: raw.peer_id ? String(raw.peer_id) : null,
    peer_name: (raw.peer_name as string | null) ?? null,
    peer_role: (raw.peer_role as string | null) ?? null,
    peer_avatar_url: (raw.peer_avatar_url as string | null) ?? null,
    last_message_at: (raw.last_message_at as Date | null) ?? null,
    last_message_preview: (raw.last_message_preview as string | null) ?? null,
    last_message_sender: raw.last_message_sender
      ? String(raw.last_message_sender)
      : null,
    last_read_at: (raw.last_read_at as Date | null) ?? null,
    created_at: (raw.created_at as Date | null) ?? null,
  };
}

function toMessageRow(raw: Record<string, unknown>): MessageRow {
  return {
    thread_id: String(raw.thread_id),
    created_at: (raw.created_at as Date | null) ?? null,
    message_id: String(raw.message_id),
    sender_id: raw.sender_id ? String(raw.sender_id) : null,
    kind: (raw.kind as string | null) ?? null,
    body: (raw.body as string | null) ?? null,
  };
}

export async function findThreadRowById(
  threadId: string,
): Promise<ThreadRow | null> {
  const result = await scylla.execute(
    `SELECT ${THREAD_COLUMNS} FROM chat_threads_by_id WHERE thread_id = ?`,
    [threadId],
    { prepare: true },
  );
  const row = result.first() as unknown as Record<string, unknown> | null;
  return row ? toThreadRow(row) : null;
}

export async function findThreadIdByPair(
  customerId: string,
  mechanicId: string,
): Promise<string | null> {
  const result = await scylla.execute(
    "SELECT thread_id FROM chat_threads_by_pair WHERE customer_id = ? AND mechanic_id = ?",
    [customerId, mechanicId],
    { prepare: true },
  );
  const row = result.first() as unknown as { thread_id: unknown } | null;
  return row?.thread_id ? String(row.thread_id) : null;
}

export type InsertThreadParams = {
  threadId: string;
  customerId: string;
  mechanicId: string;
  now: Date;
};

export async function insertThread(params: InsertThreadParams): Promise<void> {
  await scylla.batch(
    [
      {
        query:
          "INSERT INTO chat_threads_by_id (thread_id, customer_id, mechanic_id, created_at, last_message_at, last_message_preview, last_message_sender) VALUES (?, ?, ?, ?, null, null, null)",
        params: [
          params.threadId,
          params.customerId,
          params.mechanicId,
          params.now,
        ],
      },
      {
        query:
          "INSERT INTO chat_threads_by_pair (customer_id, mechanic_id, thread_id) VALUES (?, ?, ?)",
        params: [params.customerId, params.mechanicId, params.threadId],
      },
    ],
    { prepare: true },
  );
}

export type UpsertInboxParams = {
  userId: string;
  threadId: string;
  peerId: string;
  peerName: string;
  peerRole: string;
  peerAvatarUrl: string | null;
  lastMessageAt: Date | null;
  lastMessagePreview: string | null;
  lastMessageSender: string | null;
  createdAt: Date;
};

// One row per (user, thread): point-updatable, so a new message only
// rewrites the preview columns — membership and last_read_at persist.
export async function upsertInboxRow(params: UpsertInboxParams): Promise<void> {
  await scylla.execute(
    "UPDATE chat_threads_by_user SET peer_id = ?, peer_name = ?, peer_role = ?, peer_avatar_url = ?, last_message_at = ?, last_message_preview = ?, last_message_sender = ?, created_at = ? WHERE user_id = ? AND thread_id = ?",
    [
      params.peerId,
      params.peerName,
      params.peerRole,
      params.peerAvatarUrl,
      params.lastMessageAt,
      params.lastMessagePreview,
      params.lastMessageSender,
      params.createdAt,
      params.userId,
      params.threadId,
    ],
    { prepare: true },
  );
}

// Last-activity snapshot on the by_id row (mirrors the inbox preview).
export async function updateThreadSnapshot(
  threadId: string,
  at: Date,
  preview: string,
  senderId: string,
): Promise<void> {
  await scylla.execute(
    "UPDATE chat_threads_by_id SET last_message_at = ?, last_message_preview = ?, last_message_sender = ? WHERE thread_id = ?",
    [at, preview, senderId, threadId],
    { prepare: true },
  );
}

export async function findInboxRow(
  userId: string,
  threadId: string,
): Promise<InboxRow | null> {
  const result = await scylla.execute(
    `SELECT ${INBOX_COLUMNS} FROM chat_threads_by_user WHERE user_id = ? AND thread_id = ?`,
    [userId, threadId],
    { prepare: true },
  );
  const row = result.first() as unknown as Record<string, unknown> | null;
  return row ? toInboxRow(row) : null;
}

export async function listInboxRows(userId: string): Promise<InboxRow[]> {
  const result = await scylla.execute(
    `SELECT ${INBOX_COLUMNS} FROM chat_threads_by_user WHERE user_id = ? LIMIT 200`,
    [userId],
    { prepare: true },
  );
  return (result.rows as unknown as Record<string, unknown>[]).map(toInboxRow);
}

export async function markInboxRead(
  userId: string,
  threadId: string,
  readAt: Date,
): Promise<void> {
  await scylla.execute(
    "UPDATE chat_threads_by_user SET last_read_at = ? WHERE user_id = ? AND thread_id = ?",
    [readAt, userId, threadId],
    { prepare: true },
  );
}

export type InsertMessageParams = {
  threadId: string;
  messageId: string;
  senderId: string;
  kind: string;
  body: string;
  createdAt: Date;
};

export async function insertMessage(
  params: InsertMessageParams,
): Promise<void> {
  await scylla.execute(
    "INSERT INTO chat_messages_by_thread (thread_id, created_at, message_id, sender_id, kind, body) VALUES (?, ?, ?, ?, ?, ?)",
    [
      params.threadId,
      params.createdAt,
      params.messageId,
      params.senderId,
      params.kind,
      params.body,
    ],
    { prepare: true },
  );
}

export type MessagePage = {
  rows: MessageRow[];
  pageState: string | null;
};

// Newest-first page of one thread's history. pageState walks backwards
// in time — the client renders each page reversed under the previous one.
export async function listMessageRows(
  threadId: string,
  limit: number,
  pageState?: string | null,
): Promise<MessagePage> {
  const result = await scylla.execute(
    `SELECT ${MESSAGE_COLUMNS} FROM chat_messages_by_thread WHERE thread_id = ?`,
    [threadId],
    {
      prepare: true,
      fetchSize: Math.min(Math.max(limit, 1), 100),
      pageState: pageState ?? undefined,
    },
  );
  const rows = result.rows as unknown as Record<string, unknown>[];
  return {
    rows: rows.map(toMessageRow),
    pageState: result.pageState ?? null,
  };
}

// Senders of messages newer than the reader's last_read_at — the service
// drops its own id and counts the rest. Bounded so a spam burst can never
// scan a whole partition; badges saturate past the cap anyway.
export async function listUnreadSenders(
  threadId: string,
  since: Date | null,
  limit = 100,
): Promise<string[]> {
  const result = since
    ? await scylla.execute(
        "SELECT sender_id FROM chat_messages_by_thread WHERE thread_id = ? AND created_at > ? LIMIT ?",
        [threadId, since, limit],
        { prepare: true },
      )
    : await scylla.execute(
        "SELECT sender_id FROM chat_messages_by_thread WHERE thread_id = ? LIMIT ?",
        [threadId, limit],
        { prepare: true },
      );
  return (result.rows as unknown as { sender_id: unknown }[])
    .map((row) => row.sender_id)
    .filter((id) => id !== null && id !== undefined)
    .map(String);
}
