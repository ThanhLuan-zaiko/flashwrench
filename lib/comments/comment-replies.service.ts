// Replies: one level under a top-level comment, paged oldest-first. The
// parent thread decides who may read or write; replies cannot be
// replied to (service enforced via the lookup's parent_id).
import type { PublicUser } from "@/lib/auth/user.types";
import { decodeCursor, encodeCursor } from "@/lib/db/cursor";
import type {
  CommentPage,
  CommentResult,
  CommentTargetType,
} from "./comment.types";
import {
  canModerateComments,
  canReadCommentThread,
  visibleCommentRows,
} from "./comment-access";
import { toCommentItem } from "./comment-items";
import { validateParentId } from "./comment-validation";
import {
  findCommentLookup,
  listReplyRows,
  readCommentHidden,
} from "./comments.repository";

const REPLY_PAGE = 10;

function fail<T>(status: number, form: string): CommentResult<T> {
  return { ok: false, status, errors: { form } };
}

export function replyCursorScope(parentId: string): string {
  return `comments:reply:${parentId}`;
}

export async function listReplies(
  actor: PublicUser | null,
  parentId: unknown,
  cursor: string | null | undefined,
): Promise<CommentResult<CommentPage>> {
  const parsed = validateParentId(parentId);
  if (parsed.errors || !parsed.parentId) {
    return {
      ok: false,
      status: 400,
      errors: parsed.errors ?? { parentId: "Bình luận gốc không hợp lệ." },
    };
  }
  const parent = await findCommentLookup(parsed.parentId);
  if (!parent || parent.parent_id) {
    return fail(404, "Không tìm thấy bình luận gốc.");
  }
  // A hidden parent's replies stay hidden from public readers too.
  const parentHidden =
    parent.created_at !== null && (await readCommentHidden(parent));
  if (parentHidden && !canModerateComments(actor)) {
    return fail(404, "Không tìm thấy bình luận gốc.");
  }
  const access = await canReadCommentThread(
    actor,
    parent.target_type as CommentTargetType,
    parent.target_id,
  );
  if (access === "not-found") return fail(404, "Không tìm thấy mục này.");
  if (access === "forbidden") {
    return fail(403, "Bạn không có quyền xem bình luận này.");
  }

  const scope = replyCursorScope(parsed.parentId);
  let pageState: string | null = null;
  try {
    pageState = decodeCursor(cursor ?? null, scope);
  } catch {
    return fail(400, "Con trỏ phân trang không hợp lệ.");
  }
  const page = await listReplyRows(parsed.parentId, REPLY_PAGE, pageState);
  return {
    ok: true,
    data: {
      items: visibleCommentRows(page.rows, actor).map((row) =>
        toCommentItem(row, actor?.id ?? null),
      ),
      nextCursor: encodeCursor(page.pageState, scope),
    },
  };
}
