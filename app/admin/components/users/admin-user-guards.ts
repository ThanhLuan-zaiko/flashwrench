// Shared guards for admin user actions. Mirrors the backend rules in
// applyAdminUserAction: an admin can never touch their own account or
// any other admin account. Pure helpers so lists, cards and tests share
// one source of truth.
import type { AdminUserItem } from "@/lib/auth/admin-users.service";

export type ProtectedReason = "self" | "admin" | null;

export function isSelfAccount(
  currentUserId: string | null | undefined,
  targetUserId: string,
): boolean {
  if (!currentUserId) return false;
  return currentUserId === targetUserId;
}

export function isAdminAccount(role: AdminUserItem["role"]): boolean {
  return role === "admin";
}

// Null means the row is manageable; otherwise the reason it is locked
// from admin actions. Self takes precedence over the admin-role rule.
export function getProtectionReason(
  currentUserId: string | null | undefined,
  target: Pick<AdminUserItem, "id" | "role">,
): ProtectedReason {
  if (isSelfAccount(currentUserId, target.id)) return "self";
  if (isAdminAccount(target.role)) return "admin";
  return null;
}

export function canAdminManageUser(
  currentUserId: string | null | undefined,
  target: Pick<AdminUserItem, "id" | "role">,
): boolean {
  return getProtectionReason(currentUserId, target) === null;
}

// Hide the current admin from management lists so they can never even
// see a lock button for themselves. Other admin accounts stay visible
// but remain non-actionable via getProtectionReason.
export function excludeSelfAccount<T extends Pick<AdminUserItem, "id">>(
  items: T[],
  currentUserId: string | null | undefined,
): T[] {
  if (!currentUserId) return items;
  return items.filter((item) => item.id !== currentUserId);
}
