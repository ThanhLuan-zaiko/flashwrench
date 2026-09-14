"use client";

import { useState } from "react";
import { FiLoader } from "react-icons/fi";
import { useToast } from "@/components/toast/useToast";
import { useAdminUserAction, useAdminUsers } from "@/hooks/admin";
import type { AdminUserAction } from "@/lib/auth/admin-users.service";
import { AuthApiError } from "@/services/admin.api";
import { AdminUserCard } from "./AdminUserCard";

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 px-4 py-10 text-center dark:border-zinc-700">
      <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
        {title}
      </p>
      <p className="mx-auto mt-1 max-w-md text-xs text-zinc-500 dark:text-zinc-400">
        {hint}
      </p>
    </div>
  );
}

export function MechanicApprovalList() {
  const toast = useToast();
  const query = useAdminUsers({
    role: "mechanic",
    status: "pending_verification",
  });
  const action = useAdminUserAction();
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  function handleAction(userId: string, kind: AdminUserAction) {
    setPendingUserId(userId);
    action.mutate(
      { userId, action: kind },
      {
        onSuccess: () => {
          toast.success(
            kind === "approve" ? "Đã duyệt thợ" : "Đã khóa tài khoản",
            "Danh sách đã được cập nhật.",
          );
        },
        onError: (error) => {
          toast.error(
            "Thao tác thất bại",
            error instanceof AuthApiError
              ? (error.errors.form ?? "Vui lòng thử lại.")
              : "Vui lòng thử lại sau.",
          );
        },
        onSettled: () => setPendingUserId(null),
      },
    );
  }

  if (query.isPending) {
    return (
      <output
        aria-label="Đang tải hồ sơ chờ duyệt"
        className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-zinc-500 dark:text-zinc-400"
      >
        <FiLoader
          aria-hidden="true"
          className="h-4 w-4 motion-safe:animate-spin"
        />
        Đang tải hồ sơ chờ duyệt…
      </output>
    );
  }

  if (query.isError) {
    return (
      <div className="px-4 py-6 text-center">
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Không tải được danh sách. Vui lòng thử lại.
        </p>
        <button
          type="button"
          onClick={() => void query.refetch()}
          className="mt-3 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Tải lại
        </button>
      </div>
    );
  }

  const users = query.data?.users ?? [];
  if (users.length === 0) {
    return (
      <EmptyState
        title="Không có hồ sơ thợ chờ duyệt."
        hint="Hồ sơ đăng ký làm thợ mới sẽ hiện tại đây để quản trị viên xét duyệt."
      />
    );
  }

  return (
    <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {users.map((item) => (
        <AdminUserCard
          key={item.id}
          user={item}
          pendingUserId={pendingUserId}
          actions={["approve", "lock"]}
          onAction={handleAction}
        />
      ))}
    </ul>
  );
}
