import type {
  AdminRoleFilter,
  AdminUserAction,
  AdminUserItem,
} from "@/lib/auth/admin-users.service";
import type { UserStatus } from "@/lib/auth/user.types";
import { AuthApiError, apiRequest } from "./auth.api";

export type { AdminUserItem, AdminUserAction, AdminRoleFilter };
export { AuthApiError };

export type AdminUsersQuery = {
  role?: AdminRoleFilter;
  status?: UserStatus;
  months?: number;
  limit?: number;
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
