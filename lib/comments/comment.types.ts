// Shared row/response shapes for per-entity comment threads. Top-level
// comments live in comments_by_target; one level of replies lives in
// comments_by_parent, and comments_by_id maps a comment id back to its
// thread for reply validation and staff moderation.

export type CommentTargetType =
  | "booking"
  | "order"
  | "rescue"
  | "complaint"
  | "part";

export type CommentRow = {
  target_type: string;
  target_id: string;
  created_at: Date | null;
  comment_id: string;
  user_id: string | null;
  user_name: string | null;
  user_role: string | null;
  body: string | null;
  reply_count: number | null;
  is_hidden: boolean | null;
};

// Lookup projection: comment id -> its thread and (for replies) parent.
export type CommentLookupRow = {
  comment_id: string;
  target_type: string;
  target_id: string;
  parent_id: string | null;
  created_at: Date | null;
};

export type CommentItem = {
  id: string;
  userName: string;
  userRole: string;
  body: string;
  createdAt: string | null;
  mine: boolean;
  staff: boolean;
  replyCount: number;
  hidden: boolean;
};

export type CommentFieldErrors = Partial<
  Record<
    "body" | "targetType" | "targetId" | "parentId" | "action" | "form",
    string
  >
>;

export type CommentResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; errors: CommentFieldErrors };

export type CommentPage = {
  items: CommentItem[];
  nextCursor: string | null;
};
