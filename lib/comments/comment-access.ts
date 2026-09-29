// Access rules for comment threads, shared by the comment, reply and
// moderation services. Part threads are public (read without login);
// booking, order, rescue and complaint threads stay owner + staff, with
// complaint threads limiting staff to admins. Hiding is moderator-only.
import type { PublicUser, UserRole } from "@/lib/auth/user.types";
import { findComplaintRowById } from "@/lib/complaints/complaints.repository";
import { findBookingRowById } from "@/lib/mechanic/mechanic-bookings.repository";
import { findOrderRowById } from "@/lib/orders/orders.repository";
import { findPartRowById } from "@/lib/parts/parts.repository";
import { findRescueRowById } from "@/lib/rescue/rescue-workflow.repository";
import type { CommentTargetType } from "./comment.types";

const STAFF_ROLES: UserRole[] = ["admin", "dispatcher", "mechanic"];
const MODERATOR_ROLES: UserRole[] = ["admin", "dispatcher"];

export function isStaff(actor: PublicUser): boolean {
  return STAFF_ROLES.includes(actor.role);
}

// Hiding comments is admin + dispatcher territory; mechanics keep their
// normal read/write access but cannot moderate.
export function canModerateComments(actor: PublicUser | null): boolean {
  return actor !== null && MODERATOR_ROLES.includes(actor.role);
}

// Ownership probe per private target type. Returns null when the target
// does not exist; callers translate that into a generic 404.
export async function targetOwnerId(
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
export async function canReadCommentThread(
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

// Write access mirrors read access, but never anonymous and part threads
// require the product to still be on sale.
export async function canWriteComment(
  actor: PublicUser,
  targetType: CommentTargetType,
  targetId: string,
): Promise<"ok" | "not-found" | "forbidden"> {
  if (targetType === "part") {
    const part = await findPartRowById(targetId);
    return part?.is_active && !part.is_deleted ? "ok" : "not-found";
  }
  return canReadCommentThread(actor, targetType, targetId);
}

// Hidden comments stay visible to moderators (dimmed in the UI) and drop
// out of the feed for everyone else.
export function visibleCommentRows<T extends { is_hidden: boolean | null }>(
  rows: T[],
  actor: PublicUser | null,
): T[] {
  if (canModerateComments(actor)) return rows;
  return rows.filter((row) => row.is_hidden !== true);
}
