"use client";

import { FiInbox, FiLoader } from "react-icons/fi";
import type { AdminUserItem } from "@/lib/auth/admin-users.service";
import { CatalogPager } from "../services/CatalogPager";
import { usePagination } from "../services/usePagination";
import { AdminUserCard } from "./AdminUserCard";
import type { UserActionTarget } from "./useUserRowActions";

type ApprovalQueueListProps = {
  items: AdminUserItem[];
  isPending: boolean;
  isError: boolean;
  pendingUserId: string | null;
  onOpenAction: (target: UserActionTarget) => void;
  onRetry: () => void;
};

// Pending mechanic applications with confirm-then-act buttons.
// Mirrors ServiceCategoryList: skeleton, retry, empty, paged rows.
export function ApprovalQueueList({
  items,
  isPending,
  isError,
  pendingUserId,
  onOpenAction,
  onRetry,
}: ApprovalQueueListProps) {
  const pager = usePagination(items.length);
  if (isPending) {
    return (
      <ul className="flex flex-col gap-2" aria-label="Đang tải hồ sơ chờ duyệt">
        {[0, 1, 2].map((i) => (
          <li
            key={i}
            className="flex items-center gap-3 rounded-xl bg-zinc-100 px-3 py-3 dark:bg-zinc-900"
          >
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
      <div className="rounded-xl bg-zinc-100 px-4 py-10 text-center dark:bg-zinc-900">
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Không tải được danh sách. Vui lòng thử lại.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mx-auto mt-3 flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-950"
        >
          Thử lại
        </button>
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-zinc-100 px-3 py-6 dark:bg-zinc-900">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          <FiInbox aria-hidden="true" className="h-5 w-5" />
        </span>
        <span>
          <span className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            Không có hồ sơ thợ chờ duyệt
          </span>
          <span className="block text-xs text-zinc-500 dark:text-zinc-400">
            Hồ sơ đăng ký làm thợ mới sẽ hiện tại đây
          </span>
        </span>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {pager.slice(items).map((item) => (
          <AdminUserCard
            key={item.id}
            user={item}
            pendingUserId={pendingUserId}
            actions={["approve", "lock"]}
            onAction={(userId, action) =>
              onOpenAction({
                userId,
                fullName: item.fullName,
                action,
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
        total={items.length}
        onPage={pager.goTo}
      />
    </div>
  );
}
