// Shared row/response shapes for per-entity comment threads. One table
// (comments_by_target) backs every area; the service layer decides who
// may read or write each target type.

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
};

export type CommentItem = {
  id: string;
  userName: string;
  userRole: string;
  body: string;
  createdAt: string | null;
  mine: boolean;
  staff: boolean;
};

export type CommentFieldErrors = Partial<
  Record<"body" | "targetType" | "targetId" | "form", string>
>;

export type CommentResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; errors: CommentFieldErrors };

export type CommentPage = {
  items: CommentItem[];
  nextCursor: string | null;
};
