"use client";

import { useMemo } from "react";
import { FiLoader } from "react-icons/fi";
import { StaffEmptyState } from "@/components/staff/StaffEmptyState";
import { STAFF_ART } from "@/components/staff/staff-art";
import type { AdminUserItem } from "@/lib/auth/admin-users.service";
import { CatalogPager } from "../services/CatalogPager";
import { usePagination } from "../services/usePagination";
import { AdminUserCard } from "./AdminUserCard";
import { excludeSelfAccount } from "./admin-user-guards";
import type { UserActionTarget } from "./useUserRowActions";

type ApprovalQueueListProps = {
  items: AdminUserItem[];
  isPending: boolean;
  isError: boolean;
  pendingUserId: string | null;
  currentUserId?: string | null;
  onOpenAction: (target: UserActionTarget) => void;
  onRetry: () => void;
};

// Pending mechanic applications with confirm-then-act buttons.
// Mirrors ServiceCategoryList: skeleton, retry, empty, paged rows.
// The current admin is hidden; other admin rows never expose actions.
export function ApprovalQueueList({
  items,
  isPending,
  isError,
  pendingUserId,
  currentUserId,
  onOpenAction,
  onRetry,
}: ApprovalQueueListProps) {
  const manageable = useMemo(
    () => excludeSelfAccount(items, currentUserId),
    [items, currentUserId],
  );
  const pager = usePagination(manageable.length);
  if (isPending) {
    return (
      <ul
        className="divide-y divide-zinc-200 dark:divide-zinc-800"
        aria-label="Đang tải hồ sơ chờ duyệt"
      >
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex items-center gap-3 py-3">
            <FiLoader
              aria-hidden="true"
              className="h-4 w-4 motion-safe:animate-spin"
            />
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Đang tải hồ sơ chờ duyệt…
            </span>
          </li>
        ))}
      </ul>
    );
  }
  if (isError) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Không tải được danh sách. Vui lòng thử lại.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mx-auto mt-3 flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] dark:focus-visible:ring-zinc-400 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-950"
        >
          Thử lại
        </button>
      </div>
    );
  }
  if (manageable.length === 0) {
    return (
      <StaffEmptyState
        art={STAFF_ART.idCard}
        title="Không có hồ sơ thợ chờ duyệt"
        hint="Hồ sơ đăng ký làm thợ mới sẽ hiện ở đây"
      />
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {pager.slice(manageable).map((item) => (
          <AdminUserCard
            key={item.id}
            user={item}
            pendingUserId={pendingUserId}
            currentUserId={currentUserId}
            actions={["approve", "lock"]}
            onAction={(userId, action) =>
              onOpenAction({
                userId,
                fullName: item.fullName,
                action,
                role: item.role,
              })
            }
          />
        ))}
      </ul>
      <CatalogPager
        page={pager.page}
        pageCount={pager.pageCount}
        start={pager.range.start}
        end={pager.range.end}
        total={manageable.length}
        hrefFor={pager.hrefFor}
      />
    </div>
  );
}
