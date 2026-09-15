import {
  type AdminRoleRow,
  listRolePage,
  setIdStatus,
  setRoleStatus,
} from "./admin-users.repository";
import { revokeUserSessions } from "./session-revoke.service";
import { findUserById } from "./user.repository";
import { monthBucket, type UserRole, type UserStatus } from "./user.types";

export type AdminUserItem = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string | null;
};

export type AdminRoleFilter = UserRole | "all";

export type AdminUserAction = "approve" | "lock" | "unlock";

export type ListAdminUsersParams = {
  role?: AdminRoleFilter;
  status?: UserStatus;
  months?: number;
  limit?: number;
};

export type AdminUsersResult =
  | { ok: true; users: AdminUserItem[] }
  | { ok: false; status: number; errors: { form: string } };

export type AdminUserActionResult =
  | { ok: true; user: AdminUserItem }
  | { ok: false; status: number; errors: { form: string } };

const MANAGED_ROLES: UserRole[] = [
  "customer",
  "mechanic",
  "dispatcher",
  "admin",
];

const KNOWN_STATUSES: UserStatus[] = [
  "active",
  "locked",
  "pending_verification",
  "deleted",
];

function toItem(row: AdminRoleRow): AdminUserItem {
  return {
    id: row.user_id,
    fullName: row.full_name ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    role: (row.role as UserRole) ?? "customer",
    status: (row.status as UserStatus) ?? "active",
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
  };
}

// Month buckets for the role listing, newest first. Each bucket is one
// cheap single-partition read on users_by_role.
function recentMonthBuckets(count: number, now: Date = new Date()): string[] {
  const buckets: string[] = [];
  const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  for (let i = 0; i < count; i += 1) {
    buckets.push(monthBucket(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() - 1);
  }
  return buckets;
}

function clampInt(
  value: number | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  if (value === undefined || !Number.isInteger(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

// List users for the admin console. Role partitions are read in parallel
// across recent month buckets, then merged and sorted newest-first.
export async function listAdminUsers(
  params: ListAdminUsersParams,
): Promise<AdminUsersResult> {
  const role = params.role ?? "all";
  if (role !== "all" && !MANAGED_ROLES.includes(role)) {
    return {
      ok: false,
      status: 400,
      errors: { form: "Vai trò cần lọc không hợp lệ." },
    };
  }
  if (params.status !== undefined && !KNOWN_STATUSES.includes(params.status)) {
    return {
      ok: false,
      status: 400,
      errors: { form: "Trạng thái cần lọc không hợp lệ." },
    };
  }
  const months = clampInt(params.months, 6, 1, 24);
  const limit = clampInt(params.limit, 50, 1, 100);
  const roles = role === "all" ? MANAGED_ROLES : [role];
  const buckets = recentMonthBuckets(months);

  const pages = await Promise.all(
    roles.flatMap((r) => buckets.map((b) => listRolePage(r, b, limit))),
  );
  const seen = new Set<string>();
  const merged: AdminUserItem[] = [];
  for (const page of pages) {
    for (const row of page) {
      if (seen.has(row.user_id)) continue;
      seen.add(row.user_id);
      const item = toItem(row);
      if (params.status !== undefined && item.status !== params.status) {
        continue;
      }
      merged.push(item);
    }
  }
  merged.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  return { ok: true, users: merged.slice(0, limit) };
}

function fail(status: number, form: string): AdminUserActionResult {
  return { ok: false, status, errors: { form } };
}

// Change one account status. Guards: admins can never touch their own
// account or another admin, trashed (deleted) accounts must be restored
// first, and every transition is validated so approve cannot reactivate
// a locked account and lock cannot hit an already locked one. Locking
// bumps token_version to kill live sessions.
export async function applyAdminUserAction(
  adminId: string,
  targetUserId: string,
  action: AdminUserAction,
): Promise<AdminUserActionResult> {
  if (action !== "approve" && action !== "lock" && action !== "unlock") {
    return fail(400, "Hành động không hợp lệ.");
  }
  const target = await findUserById(targetUserId);
  if (!target) return fail(404, "Không tìm thấy người dùng.");
  if (target.user_id === adminId) {
    return fail(403, "Không thể thay đổi trạng thái tài khoản của chính mình.");
  }
  if (target.role === "admin") {
    return fail(
      403,
      "Không thể thay đổi trạng thái tài khoản quản trị viên khác.",
    );
  }

  const current = (target.status as UserStatus) ?? "active";
  if (current === "deleted") {
    return fail(
      400,
      "Tài khoản đang nằm trong thùng rác. Hãy khôi phục trước khi thao tác.",
    );
  }
  let next: UserStatus;
  let bumpToken = false;
  if (action === "approve") {
    if (current !== "pending_verification") {
      return fail(400, "Chỉ duyệt được tài khoản đang chờ xác minh.");
    }
    next = "active";
  } else if (action === "lock") {
    if (current === "locked") {
      return fail(400, "Tài khoản đã bị khóa trước đó.");
    }
    next = "locked";
    bumpToken = true;
  } else {
    if (current !== "locked") {
      return fail(400, "Tài khoản đang hoạt động, không cần mở khóa.");
    }
    next = "active";
  }

  const now = new Date();
  const createdAt = target.created_at ? new Date(target.created_at) : now;
  const role = (target.role as UserRole) ?? "customer";
  const nextToken = bumpToken ? (target.token_version ?? 0) + 1 : null;
  await setIdStatus(target.user_id, next, nextToken, now);
  await setRoleStatus(
    role,
    monthBucket(createdAt),
    createdAt,
    target.user_id,
    next,
  );

  // Forced logout: the token_version bump above already invalidates every
  // live access token, dropping the refresh families removes the ability to
  // come back on any device. The route then publishes the realtime notice
  // that makes the browser leave immediately.
  if (bumpToken) await revokeUserSessions(target.user_id);

  const updated = await findUserById(target.user_id);
  if (!updated) return fail(404, "Không tìm thấy người dùng.");
  return {
    ok: true,
    user: {
      id: updated.user_id,
      fullName: updated.full_name ?? "",
      phone: updated.phone ?? "",
      email: updated.email ?? "",
      role: (updated.role as UserRole) ?? "customer",
      status: (updated.status as UserStatus) ?? "active",
      createdAt: updated.created_at
        ? new Date(updated.created_at).toISOString()
        : null,
    },
  };
}
