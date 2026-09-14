"use client";

import { useMemo, useState } from "react";
import { FiLoader, FiSearch } from "react-icons/fi";
import { useToast } from "@/components/toast/useToast";
import { useAdminUserAction, useAdminUsers } from "@/hooks/admin";
import type { AdminUserAction } from "@/lib/auth/admin-users.service";
import { AuthApiError } from "@/services/admin.api";
import { AdminUserCard } from "./AdminUserCard";

export function AccountLockList() {
  const toast = useToast();
  const query = useAdminUsers({ role: "all" });
  const action = useAdminUserAction();
  const [text, setText] = useState("");
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const users = useMemo(() => {
    const all = query.data?.users ?? [];
    const needle = text.trim().toLowerCase();
    if (!needle) return all;
    return all.filter((u) =>
      [u.fullName, u.phone, u.email].some((f) =>
        f.toLowerCase().includes(needle),
      ),
    );
  }, [query.data, text]);

  function handleAction(userId: string, kind: AdminUserAction) {
    setPendingUserId(userId);
    action.mutate(
      { userId, action: kind },
      {
        onSuccess: () => {
          toast.success(
            kind === "lock" ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản",
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

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label
          htmlFor="admin-user-search"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Tìm kiếm
        </label>
        <div className="relative mt-2">
          <FiSearch
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
          />
          <input
            id="admin-user-search"
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Nhập số điện thoại, email hoặc họ tên…"
            className="w-full rounded-lg border border-zinc-300 bg-white py-2 pr-3 pl-9 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500"
          />
        </div>
      </div>

      {query.isPending ? (
        <output
          aria-label="Đang tải danh sách tài khoản"
          className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-zinc-500 dark:text-zinc-400"
        >
          <FiLoader
            aria-hidden="true"
            className="h-4 w-4 motion-safe:animate-spin"
          />
          Đang tải danh sách tài khoản…
        </output>
      ) : query.isError ? (
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
      ) : users.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 px-4 py-10 text-center dark:border-zinc-700">
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            Không tìm thấy tài khoản phù hợp.
          </p>
          <p className="mx-auto mt-1 max-w-md text-xs text-zinc-500 dark:text-zinc-400">
            Thử từ khóa khác hoặc mở rộng khoảng thời gian tìm kiếm.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {users.map((item) => (
            <AdminUserCard
              key={item.id}
              user={item}
              pendingUserId={pendingUserId}
              actions={item.status === "locked" ? ["unlock"] : ["lock"]}
              onAction={handleAction}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
