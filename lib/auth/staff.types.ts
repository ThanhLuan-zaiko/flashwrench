import type { AdminUserItem } from "./admin-users.service";
import type { StaffFieldErrors } from "./staff.validation";
import type { UserRole, UserRow, UserStatus } from "./user.types";

export type StaffResult =
  | { ok: true; user: AdminUserItem }
  | { ok: false; status: number; errors: StaffFieldErrors };

export type StaffCreateResult =
  | { ok: true; user: AdminUserItem; tempPassword: string }
  | { ok: false; status: number; errors: StaffFieldErrors };

// The guard outcome shared by every staff mutation.
export type TargetGate = { error: StaffResult } | { target: UserRow };

export function fail<T extends StaffResult | StaffCreateResult>(
  status: number,
  form: string,
): T {
  return { ok: false, status, errors: { form } } as T;
}

export function failFields<T extends StaffResult | StaffCreateResult>(
  status: number,
  errors: StaffFieldErrors,
): T {
  return { ok: false, status, errors } as T;
}

// Shared row/response shape for staff endpoints: one UserRow in,
// one AdminUserItem out. Lives here per the repository/service pattern.
export function toStaffItem(row: {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  role: string | null;
  status: string | null;
  created_at: Date | null;
}): AdminUserItem {
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
