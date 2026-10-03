"use client";

import { useMemo, useState } from "react";
import { FiInbox, FiLoader } from "react-icons/fi";
import type { AdminUserItem } from "@/lib/auth/admin-users.service";
import { CatalogPager } from "../services/CatalogPager";
import { usePagination } from "../services/usePagination";
import { excludeSelfAccount } from "./admin-user-guards";
import { StaffCard } from "./StaffCard";

type CustomerManageListProps = {
  items: AdminUserItem[];
  isPending: boolean;
  isError: boolean;
  pendingId: string | null;
  currentUserId?: string | null;
  onEdit: (item: AdminUserItem) => void;
  onSoft: (item: AdminUserItem) => void;
  onRetry: () => void;
};

// Live customer accounts with search — no role filter (single role) and
// no staff-only extras (temp passwords, realtime badge). Actions are the
// shared staff row actions: edit profile and soft delete.
export function CustomerManageList({
  items,
  isPending,
  isError,
  pendingId,
  currentUserId,
  onEdit,
  onSoft,
  onRetry,
}: CustomerManageListProps) {
  const [text, setText] = useState("");
  const visible = useMemo(() => {
    const needle = text.trim().toLowerCase();
    return excludeSelfAccount(items, currentUserId).filter((u) => {
      if (!needle) return true;
      return [u.fullName, u.phone, u.email].some((f) =>
        f.toLowerCase().includes(needle),
      );
    });
  }, [items, text, currentUserId]);
  const pager = usePagination(visible.length);

  const handleText = (value: string) => {
    pager.reset();
    setText(value);
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label
          htmlFor="customer-search"
          className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
        >
          Tìm kiếm
        </label>
        <input
          id="customer-search"
          type="search"
          value={text}
          onChange={(e) => handleText(e.target.value)}
          placeholder="Tên, số điện thoại, email…"
          className="mt-1.5 min-h-[44px] w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 sm:max-w-md dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500"
        />
      </div>

      {isPending ? (
        <ul className="flex flex-col gap-2" aria-label="Đang tải khách hàng">
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
                Đang tải khách hàng…
              </span>
            </li>
          ))}
        </ul>
      ) : isError ? (
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
      ) : visible.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl bg-zinc-100 px-3 py-6 dark:bg-zinc-900">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            <FiInbox aria-hidden="true" className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Chưa có khách hàng nào
            </span>
            <span className="block text-xs text-zinc-500 dark:text-zinc-400">
              Khách hàng tự đăng ký tài khoản từ trang chủ
            </span>
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {pager.slice(visible).map((item) => (
              <StaffCard
                key={item.id}
                user={item}
                pendingId={pendingId}
                variant="live"
                onEdit={onEdit}
                onSoft={onSoft}
              />
            ))}
          </ul>
          <CatalogPager
            page={pager.page}
            pageCount={pager.pageCount}
            start={pager.range.start}
            end={pager.range.end}
            total={visible.length}
            hrefFor={pager.hrefFor}
          />
        </div>
      )}
    </div>
  );
}
