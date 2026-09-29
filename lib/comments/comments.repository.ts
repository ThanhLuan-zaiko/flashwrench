// Raw CQL for comment threads. One partition per (target_type, target_id)
// keeps each entity's discussion area independent and paged newest-first.
// Replies live in comments_by_parent (oldest first) and comments_by_id
// maps any comment back to its thread for reply checks and moderation.
import { scylla } from "@/lib/db/client";
import type { CommentLookupRow, CommentRow } from "./comment.types";

type RawRow = Record<string, unknown>;

const COMMENT_COLUMNS =
  "target_type, target_id, created_at, comment_id, user_id, user_name, user_role, body, is_hidden";

function toStringOrNull(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toBoolOrNull(value: unknown): boolean | null {
  if (value === null || value === undefined) return null;
  return value === true || value === "true";
}

function toDateOrNull(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function toCommentRow(raw: RawRow): CommentRow {
  return {
    target_type: String(raw.target_type),
    target_id: String(raw.target_id),
    created_at: toDateOrNull(raw.created_at),
    comment_id: String(raw.comment_id),
    user_id: toStringOrNull(raw.user_id),
    user_name: toStringOrNull(raw.user_name),
    user_role: toStringOrNull(raw.user_role),
    body: toStringOrNull(raw.body),
    is_hidden: toBoolOrNull(raw.is_hidden),
  };
}

export type CommentWrite = {
  targetType: string;
  targetId: string;
  commentId: string;
  userId: string;
  userName: string;
  userRole: string;
  body: string;
  createdAt: Date;
};

// Top-level write: the thread row plus the id lookup in one batch.
export async function insertComment(write: CommentWrite): Promise<void> {
  await scylla.batch(
    [
      {
        query:
          "INSERT INTO comments_by_target (target_type, target_id, created_at, comment_id, user_id, user_name, user_role, body) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        params: [
          write.targetType,
          write.targetId,
          write.createdAt,
          write.commentId,
          write.userId,
          write.userName,
          write.userRole,
          write.body,
        ],
      },
      {
        query:
          "INSERT INTO comments_by_id (comment_id, target_type, target_id, parent_id, created_at) VALUES (?, ?, ?, null, ?)",
        params: [
          write.commentId,
          write.targetType,
          write.targetId,
          write.createdAt,
        ],
      },
    ],
    { prepare: true },
  );
}

// Reply write: the reply row plus the id lookup; the parent's counter is
// bumped separately by the service (atomic COUNTER delta).
export async function insertReply(
  write: CommentWrite & { parentId: string },
): Promise<void> {
  await scylla.batch(
    [
      {
        query:
          "INSERT INTO comments_by_parent (parent_id, created_at, comment_id, target_type, target_id, user_id, user_name, user_role, body) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        params: [
          write.parentId,
          write.createdAt,
          write.commentId,
          write.targetType,
          write.targetId,
          write.userId,
          write.userName,
          write.userRole,
          write.body,
        ],
      },
      {
        query:
          "INSERT INTO comments_by_id (comment_id, target_type, target_id, parent_id, created_at) VALUES (?, ?, ?, ?, ?)",
        params: [
          write.commentId,
          write.targetType,
          write.targetId,
          write.parentId,
          write.createdAt,
        ],
      },
    ],
    { prepare: true },
  );
}

export async function listCommentRows(
  targetType: string,
  targetId: string,
  limit: number,
  pageState: string | null,
): Promise<{ rows: CommentRow[]; pageState: string | null }> {
  const result = await scylla.execute(
    `SELECT ${COMMENT_COLUMNS} FROM comments_by_target WHERE target_type = ? AND target_id = ?`,
    [targetType, targetId],
    {
      prepare: true,
      fetchSize: limit,
      pageState: pageState ?? undefined,
    },
  );
  return {
    rows: result.rows.map((r) => toCommentRow(r as unknown as RawRow)),
    pageState: result.pageState ?? null,
  };
}

export async function listReplyRows(
  parentId: string,
  limit: number,
  pageState: string | null,
): Promise<{ rows: CommentRow[]; pageState: string | null }> {
  const result = await scylla.execute(
    `SELECT ${COMMENT_COLUMNS} FROM comments_by_parent WHERE parent_id = ?`,
    [parentId],
    {
      prepare: true,
      fetchSize: limit,
      pageState: pageState ?? undefined,
    },
  );
  return {
    rows: result.rows.map((r) => toCommentRow(r as unknown as RawRow)),
    pageState: result.pageState ?? null,
  };
}

// Locate a comment's thread + parent by id for reply checks/moderation.
export async function findCommentLookup(
  commentId: string,
): Promise<CommentLookupRow | null> {
  const result = await scylla.execute(
    "SELECT comment_id, target_type, target_id, parent_id, created_at FROM comments_by_id WHERE comment_id = ?",
    [commentId],
    { prepare: true },
  );
  const row = result.first() as unknown as RawRow | null;
  return row
    ? {
        comment_id: String(row.comment_id),
        target_type: String(row.target_type),
        target_id: String(row.target_id),
        parent_id: toStringOrNull(row.parent_id),
        created_at: toDateOrNull(row.created_at),
      }
    : null;
}

// Rows written before comments_by_id existed have no lookup entry. A
// single-partition scan (bounded by the thread key) finds a top-level
// comment by id so replies and moderation still work for them.
export async function findTopLevelLocation(
  targetType: string,
  targetId: string,
  commentId: string,
): Promise<CommentLookupRow | null> {
  const result = await scylla.execute(
    "SELECT target_type, target_id, created_at, comment_id FROM comments_by_target WHERE target_type = ? AND target_id = ? AND comment_id = ? ALLOW FILTERING",
    [targetType, targetId, commentId],
    { prepare: true },
  );
  const row = result.first() as unknown as RawRow | null;
  return row
    ? {
        comment_id: String(row.comment_id),
        target_type: String(row.target_type),
        target_id: String(row.target_id),
        parent_id: null,
        created_at: toDateOrNull(row.created_at),
      }
    : null;
}

// Backfill the lookup table once a legacy row is located.
export async function indexCommentLookup(row: CommentLookupRow): Promise<void> {
  await scylla.execute(
    "INSERT INTO comments_by_id (comment_id, target_type, target_id, parent_id, created_at) VALUES (?, ?, ?, ?, ?)",
    [
      row.comment_id,
      row.target_type,
      row.target_id,
      row.parent_id,
      row.created_at,
    ],
    { prepare: true },
  );
}

// Visible reply count of a top-level comment. Backed by a real COUNTER
// column so reply writes and moderation hides stay atomic — callers
// never read-modify-write.
export async function readReplyCount(commentId: string): Promise<number> {
  const result = await scylla.execute(
    "SELECT reply_count FROM comment_reply_counters WHERE comment_id = ?",
    [commentId],
    { prepare: true },
  );
  const row = result.first() as unknown as RawRow | null;
  return row ? (toNumberOrNull(row.reply_count) ?? 0) : 0;
}

export async function bumpReplyCount(
  commentId: string,
  delta: number,
): Promise<void> {
  await scylla.execute(
    "UPDATE comment_reply_counters SET reply_count = reply_count + ? WHERE comment_id = ?",
    [delta, commentId],
    { prepare: true },
  );
}

// Current hidden flag of a comment (top-level or reply) so moderation
// can no-op when the state already matches.
export async function readCommentHidden(
  lookup: CommentLookupRow,
): Promise<boolean> {
  const query = lookup.parent_id
    ? "SELECT is_hidden FROM comments_by_parent WHERE parent_id = ? AND created_at = ? AND comment_id = ?"
    : "SELECT is_hidden FROM comments_by_target WHERE target_type = ? AND target_id = ? AND created_at = ? AND comment_id = ?";
  const params = lookup.parent_id
    ? [lookup.parent_id, lookup.created_at, lookup.comment_id]
    : [
        lookup.target_type,
        lookup.target_id,
        lookup.created_at,
        lookup.comment_id,
      ];
  const result = await scylla.execute(query, params, { prepare: true });
  const row = result.first() as unknown as RawRow | null;
  return row?.is_hidden === true;
}

// Hide/unhide on whichever table holds the comment (parent_id from the
// lookup decides). Written rows keep hidden_by/hidden_at for audit.
export async function setCommentHidden(params: {
  lookup: CommentLookupRow;
  hidden: boolean;
  staffId: string;
}): Promise<void> {
  const { lookup, hidden, staffId } = params;
  const hiddenAt = hidden ? new Date() : null;
  if (lookup.parent_id) {
    await scylla.execute(
      "UPDATE comments_by_parent SET is_hidden = ?, hidden_by = ?, hidden_at = ? WHERE parent_id = ? AND created_at = ? AND comment_id = ?",
      [
        hidden,
        staffId,
        hiddenAt,
        lookup.parent_id,
        lookup.created_at,
        lookup.comment_id,
      ],
      { prepare: true },
    );
    return;
  }
  await scylla.execute(
    "UPDATE comments_by_target SET is_hidden = ?, hidden_by = ?, hidden_at = ? WHERE target_type = ? AND target_id = ? AND created_at = ? AND comment_id = ?",
    [
      hidden,
      staffId,
      hiddenAt,
      lookup.target_type,
      lookup.target_id,
      lookup.created_at,
      lookup.comment_id,
    ],
    { prepare: true },
  );
}
