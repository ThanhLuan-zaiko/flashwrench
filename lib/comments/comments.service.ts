// Comment threads: one discussion area per entity. Part threads are
// public (read without login, write requires an account). Booking,
// order, rescue and complaint threads stay between the owner and staff.
import { randomUUID } from "node:crypto";
import type { PublicUser, UserRole } from "@/lib/auth/user.types";
import { findComplaintRowById } from "@/lib/complaints/complaints.repository";
import { decodeCursor, encodeCursor } from "@/lib/db/cursor";
import { findBookingRowById } from "@/lib/mechanic/mechanic-bookings.repository";
import { findOrderRowById } from "@/lib/orders/orders.repository";
import { findPartRowById } from "@/lib/parts/parts.repository";
import {
  COMPLAINTS_TOPIC,
  OPERATIONS_TOPIC,
  userTopic,
} from "@/lib/realtime/protocol";
import { publishRealtimeEvent } from "@/lib/realtime/publish";
import { findRescueRowById } from "@/lib/rescue/rescue-workflow.repository";
import type {
  CommentItem,
  CommentPage,
  CommentResult,
  CommentRow,
  CommentTargetType,
} from "./comment.types";
import {
  validateCommentBody,
  validateCommentTarget,
} from "./comment-validation";
import { insertComment, listCommentRows } from "./comments.repository";

const COMMENT_PAGE = 10;
const STAFF_ROLES: UserRole[] = ["admin", "dispatcher", "mechanic"];

function fail<T>(status: number, form: string): CommentResult<T> {
  return { ok: false, status, errors: { form } };
}

function isStaff(actor: PublicUser): boolean {
  return STAFF_ROLES.includes(actor.role);
}

// Ownership probe per private target type. Returns null when the target
// does not exist; callers translate that into a generic 404.
async function targetOwnerId(
  targetType: CommentTargetType,
  targetId: string,
): Promise<string | null | undefined> {
  if (targetType === "booking") {
    const row = await findBookingRowById(targetId);
    return row === null ? null : (row.customer_id ?? undefined);
  }
  if (targetType === "order") {
    const row = await findOrderRowById(targetId);
    return row === null ? null : (row.customer_id ?? undefined);
  }
  if (targetType === "rescue") {
    const row = await findRescueRowById(targetId);
    return row === null ? null : (row.customer_id ?? undefined);
  }
  if (targetType === "complaint") {
    const row = await findComplaintRowById(targetId);
    return row === null ? null : (row.reporter_user_id ?? undefined);
  }
  return undefined;
}

// Read access: part threads are public; private threads need the owner
// or a staff member. Complaint threads limit staff to admins only.
async function canRead(
  actor: PublicUser | null,
  targetType: CommentTargetType,
  targetId: string,
): Promise<"ok" | "not-found" | "forbidden"> {
  if (targetType === "part") {
    const part = await findPartRowById(targetId);
    return part && !part.is_deleted ? "ok" : "not-found";
  }
  const owner = await targetOwnerId(targetType, targetId);
  if (owner === null) return "not-found";
  if (!actor) return "forbidden";
  if (owner === actor.id) return "ok";
  if (targetType === "complaint")
    return actor.role === "admin" ? "ok" : "forbidden";
  return isStaff(actor) ? "ok" : "forbidden";
}

// Write access mirrors read access, but never anonymous.
async function canWrite(
  actor: PublicUser,
  targetType: CommentTargetType,
  targetId: string,
): Promise<"ok" | "not-found" | "forbidden"> {
  if (targetType === "part") {
    const part = await findPartRowById(targetId);
    return part?.is_active && !part.is_deleted ? "ok" : "not-found";
  }
  return canRead(actor, targetType, targetId);
}

function toItem(row: CommentRow, actorId: string | null): CommentItem {
  const role = row.user_role ?? "customer";
  return {
    id: row.comment_id,
    userName: row.user_name ?? "Người dùng",
    userRole: role,
    body: row.body ?? "",
    createdAt: row.created_at ? row.created_at.toISOString() : null,
    mine: actorId !== null && row.user_id === actorId,
    staff: role !== "customer",
  };
}

function commentCursorScope(targetType: string, targetId: string): string {
  return `comments:${targetType}:${targetId}`;
}

export async function listComments(
  actor: PublicUser | null,
  targetType: unknown,
  targetId: unknown,
  cursor: string | null | undefined,
): Promise<CommentResult<CommentPage>> {
  const targetError = validateCommentTarget(targetType, targetId);
  if (targetError)
    return { ok: false, status: 400, errors: targetError.errors };
  const type = targetType as CommentTargetType;
  const id = targetId as string;

  const access = await canRead(actor, type, id);
  if (access === "not-found") return fail(404, "Không tìm thấy mục này.");
  if (access === "forbidden") {
    return fail(403, "Bạn không có quyền xem bình luận này.");
  }

  const scope = commentCursorScope(type, id);
  let pageState: string | null = null;
  try {
    pageState = decodeCursor(cursor ?? null, scope);
  } catch {
    return fail(400, "Con trỏ phân trang không hợp lệ.");
  }
  const page = await listCommentRows(type, id, COMMENT_PAGE, pageState);
  return {
    ok: true,
    data: {
      items: page.rows.map((row) => toItem(row, actor?.id ?? null)),
      nextCursor: encodeCursor(page.pageState, scope),
    },
  };
}

// Notify the counterpart so threads refresh live: customer posts reach
// the staff board, staff replies reach the owner's user topic.
async function publishComment(
  targetType: CommentTargetType,
  targetId: string,
  ownerId: string | null,
): Promise<void> {
  const kind =
    targetType === "complaint"
      ? "complaint-updated"
      : targetType === "rescue"
        ? "rescue-updated"
        : targetType === "order"
          ? "order-updated"
          : "booking-updated";
  const topics = new Set<string>([OPERATIONS_TOPIC]);
  if (ownerId) topics.add(userTopic(ownerId));
  if (targetType === "complaint") topics.add(COMPLAINTS_TOPIC);
  const payload: Record<string, string> = {};
  if (targetType === "booking") payload.bookingId = targetId;
  if (targetType === "order") payload.orderId = targetId;
  if (targetType === "rescue") payload.rescueId = targetId;
  if (targetType === "complaint") payload.complaintId = targetId;
  await Promise.all(
    [...topics].map((topic) =>
      publishRealtimeEvent(topic, { kind, ...payload }),
    ),
  );
}

export async function addComment(
  actor: PublicUser,
  targetType: unknown,
  targetId: unknown,
  raw: unknown,
): Promise<CommentResult<CommentItem>> {
  const targetError = validateCommentTarget(targetType, targetId);
  if (targetError)
    return { ok: false, status: 400, errors: targetError.errors };
  const type = targetType as CommentTargetType;
  const id = targetId as string;

  const bodyError =
    typeof raw === "object" && raw !== null && !Array.isArray(raw)
      ? validateCommentBody((raw as Record<string, unknown>).body)
      : {
          body: "",
          errors: { body: "Nội dung bình luận không được để trống." },
        };
  if (bodyError.errors)
    return { ok: false, status: 400, errors: bodyError.errors };

  const access = await canWrite(actor, type, id);
  if (access === "not-found") return fail(404, "Không tìm thấy mục này.");
  if (access === "forbidden") {
    return fail(403, "Bạn không có quyền bình luận ở đây.");
  }

  const write = {
    targetType: type,
    targetId: id,
    commentId: randomUUID(),
    userId: actor.id,
    userName: actor.fullName,
    userRole: actor.role,
    body: bodyError.body,
    createdAt: new Date(),
  };
  await insertComment(write);

  if (type !== "part") {
    const owner = await targetOwnerId(type, id);
    void publishComment(type, id, owner ?? null);
  }

  return {
    ok: true,
    data: {
      id: write.commentId,
      userName: write.userName,
      userRole: write.userRole,
      body: write.body,
      createdAt: write.createdAt.toISOString(),
      mine: true,
      staff: write.userRole !== "customer",
    },
  };
}
