import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserStatus } from "@/lib/auth/user.types";
import {
  type AdminRoleFilter,
  type AdminUserAction,
  type AdminUserItem,
  adminUserActionRequest,
  createStaffRequest,
  fetchAdminUsers,
  hardDeleteStaffRequest,
  restoreStaffRequest,
  type StaffCreateInput,
  type StaffUpdateInput,
  softDeleteStaffRequest,
  updateStaffRequest,
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

function useStaffMutation<TArgs extends Record<string, unknown>>(
  task: (args: TArgs) => Promise<{ user: AdminUserItem }>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: task,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: StaffCreateInput) => createStaffRequest(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}

export function useUpdateStaff() {
  return useStaffMutation(
    ({ userId, ...payload }: StaffUpdateInput & { userId: string }) =>
      updateStaffRequest(userId, payload),
  );
}

export function useSoftDeleteStaff() {
  return useStaffMutation(({ userId }: { userId: string }) =>
    softDeleteStaffRequest(userId),
  );
}

export function useRestoreStaff() {
  return useStaffMutation(({ userId }: { userId: string }) =>
    restoreStaffRequest(userId),
  );
}

export function useHardDeleteStaff() {
  return useStaffMutation(
    ({ userId, confirm }: { userId: string; confirm: string }) =>
      hardDeleteStaffRequest(userId, confirm),
  );
}
