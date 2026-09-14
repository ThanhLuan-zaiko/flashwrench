import { scylla } from "@/lib/db/client";
import type { UserRole } from "./user.types";

// One denormalized row of users_by_role. This table carries every field
// the admin list needs, so listing never fans out to users_by_id.
export type AdminRoleRow = {
  role: string | null;
  month_bucket: string | null;
  created_at: Date | null;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  status: string | null;
};

function toRoleRow(row: Record<string, unknown>): AdminRoleRow {
  return {
    role: (row.role as string | null) ?? null,
    month_bucket: (row.month_bucket as string | null) ?? null,
    created_at: (row.created_at as Date | null) ?? null,
    user_id: String(row.user_id),
    full_name: (row.full_name as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    status: (row.status as string | null) ?? null,
  };
}

// Single-partition read: (role, month_bucket) is the partition key,
// so this never needs ALLOW FILTERING.
export async function listRolePage(
  role: UserRole,
  monthBucketValue: string,
  limit: number,
): Promise<AdminRoleRow[]> {
  const result = await scylla.execute(
    "SELECT role, month_bucket, created_at, user_id, full_name, phone, email, status FROM users_by_role WHERE role = ? AND month_bucket = ? LIMIT ?",
    [role, monthBucketValue, limit],
    { prepare: true },
  );
  return result.rows.map((r) =>
    toRoleRow(r as unknown as Record<string, unknown>),
  );
}

// Status lives in both users_by_id (source of truth for auth) and
// users_by_role (denormalized admin read model). Callers update both.
export async function setIdStatus(
  userId: string,
  status: string,
  tokenVersion: number | null,
  updatedAt: Date,
): Promise<void> {
  if (tokenVersion === null) {
    await scylla.execute(
      "UPDATE users_by_id SET status = ?, updated_at = ? WHERE user_id = ?",
      [status, updatedAt, userId],
      { prepare: true },
    );
    return;
  }
  await scylla.execute(
    "UPDATE users_by_id SET status = ?, token_version = ?, updated_at = ? WHERE user_id = ?",
    [status, tokenVersion, updatedAt, userId],
    { prepare: true },
  );
}

export async function setRoleStatus(
  role: string,
  monthBucketValue: string,
  createdAt: Date,
  userId: string,
  status: string,
): Promise<void> {
  await scylla.execute(
    "UPDATE users_by_role SET status = ? WHERE role = ? AND month_bucket = ? AND created_at = ? AND user_id = ?",
    [status, role, monthBucketValue, createdAt, userId],
    { prepare: true },
  );
}
