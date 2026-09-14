import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserStatus } from "@/lib/auth/user.types";
import {
  type AdminRoleFilter,
  type AdminUserAction,
  type AdminUserItem,
  adminUserActionRequest,
  fetchAdminUsers,
} from "@/services/admin.api";

export type { AdminUserItem, AdminUserAction };

export const adminKeys = {
  all: ["admin"] as const,
  users: (query: { role?: AdminRoleFilter; status?: UserStatus }) =>
    ["admin", "users", query] as const,
};

export function useAdminUsers(query: {
  role?: AdminRoleFilter;
  status?: UserStatus;
}) {
  return useQuery({
    queryKey: adminKeys.users(query),
    queryFn: () => fetchAdminUsers(query),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useAdminUserAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      action,
    }: {
      userId: string;
      action: AdminUserAction;
    }) => adminUserActionRequest(userId, action),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}
