// Raw CQL for comment threads. One partition per (target_type, target_id)
// keeps each entity's discussion area independent and paged newest-first.
import { scylla } from "@/lib/db/client";
import type { CommentRow } from "./comment.types";

type RawRow = Record<string, unknown>;

function toStringOrNull(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
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
  };
}

export async function insertComment(write: {
  targetType: string;
  targetId: string;
  commentId: string;
  userId: string;
  userName: string;
  userRole: string;
  body: string;
  createdAt: Date;
}): Promise<void> {
  await scylla.execute(
    "INSERT INTO comments_by_target (target_type, target_id, created_at, comment_id, user_id, user_name, user_role, body) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      write.targetType,
      write.targetId,
      write.createdAt,
      write.commentId,
      write.userId,
      write.userName,
      write.userRole,
      write.body,
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
    "SELECT target_type, target_id, created_at, comment_id, user_id, user_name, user_role, body FROM comments_by_target WHERE target_type = ? AND target_id = ?",
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
