import type {
  AdminRoleFilter,
  AdminUserAction,
  AdminUserItem,
} from "@/lib/auth/admin-users.service";
import type {
  StaffCreateInput,
  StaffFieldErrors,
  StaffUpdateInput,
} from "@/lib/auth/staff.validation";
import type { UserStatus } from "@/lib/auth/user.types";
import { AuthApiError, apiRequest } from "./auth.api";

export type { AdminUserItem, AdminUserAction, AdminRoleFilter };
export type { StaffCreateInput, StaffUpdateInput, StaffFieldErrors };
export { AuthApiError };

export type AdminUsersQuery = {
  role?: AdminRoleFilter;
  status?: UserStatus;
  months?: number;
  limit?: number;
};

export type PendingStaffPassword = {
  userId: string;
  tempPassword: string;
  createdAt: string | null;
};

function toQueryString(query: AdminUsersQuery): string {
  const params = new URLSearchParams();
  if (query.role) params.set("role", query.role);
  if (query.status) params.set("status", query.status);
  if (query.months !== undefined) params.set("months", String(query.months));
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  const text = params.toString();
  return text ? `?${text}` : "";
}

export function fetchAdminUsers(
  query: AdminUsersQuery,
): Promise<{ users: AdminUserItem[] }> {
  return apiRequest<{ users: AdminUserItem[] }>(
    `/api/admin/users${toQueryString(query)}`,
  );
}

export function adminUserActionRequest(
  userId: string,
  action: AdminUserAction,
): Promise<{ user: AdminUserItem }> {
  return apiRequest<{ user: AdminUserItem }>(
    `/api/admin/users/${encodeURIComponent(userId)}`,
    { method: "PATCH", body: JSON.stringify({ action }) },
  );
}

export function createStaffRequest(
  payload: StaffCreateInput,
): Promise<{ user: AdminUserItem; tempPassword: string }> {
  return apiRequest<{ user: AdminUserItem; tempPassword: string }>(
    "/api/admin/users",
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export function updateStaffRequest(
  userId: string,
  payload: StaffUpdateInput,
): Promise<{ user: AdminUserItem }> {
  return apiRequest<{ user: AdminUserItem }>(
    `/api/admin/users/${encodeURIComponent(userId)}`,
    { method: "PATCH", body: JSON.stringify({ action: "update", ...payload }) },
  );
}

export function softDeleteStaffRequest(
  userId: string,
): Promise<{ user: AdminUserItem }> {
  return apiRequest<{ user: AdminUserItem }>(
    `/api/admin/users/${encodeURIComponent(userId)}`,
    { method: "PATCH", body: JSON.stringify({ action: "soft" }) },
  );
}

export function restoreStaffRequest(
  userId: string,
): Promise<{ user: AdminUserItem }> {
  return apiRequest<{ user: AdminUserItem }>(
    `/api/admin/users/${encodeURIComponent(userId)}`,
    { method: "PATCH", body: JSON.stringify({ action: "restore" }) },
  );
}

export function hardDeleteStaffRequest(
  userId: string,
  confirm: string,
): Promise<{ user: AdminUserItem }> {
  return apiRequest<{ user: AdminUserItem }>(
    `/api/admin/users/${encodeURIComponent(userId)}`,
    { method: "DELETE", body: JSON.stringify({ confirm }) },
  );
}

export function fetchPendingStaffPasswords(userIds: string[]): Promise<{
  items: PendingStaffPassword[];
  cryptoConfigured: boolean;
}> {
  return apiRequest<{
    items: PendingStaffPassword[];
    cryptoConfigured: boolean;
  }>("/api/admin/users/pending-passwords", {
    method: "POST",
    body: JSON.stringify({ userIds }),
  });
}

export function resetStaffPasswordRequest(
  userId: string,
): Promise<{ user: AdminUserItem; tempPassword: string }> {
  return apiRequest<{ user: AdminUserItem; tempPassword: string }>(
    `/api/admin/users/${encodeURIComponent(userId)}`,
    { method: "POST" },
  );
}
