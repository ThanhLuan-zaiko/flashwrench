"use client";

import { useMemo, useState } from "react";
import { FiLoader, FiUsers } from "react-icons/fi";
import { StaffEmptyState } from "@/components/staff/StaffEmptyState";
import { STAFF_ART } from "@/components/staff/staff-art";
import type { AdminUserItem } from "@/lib/auth/admin-users.service";
import { CatalogPager } from "../services/CatalogPager";
import { SelectDropdown } from "../services/SelectDropdown";
import { usePagination } from "../services/usePagination";
import { AdminUserCard } from "./AdminUserCard";
import { excludeSelfAccount } from "./admin-user-guards";
import type { UserActionTarget } from "./useUserRowActions";

type AccountManageListProps = {
  items: AdminUserItem[];
  isPending: boolean;
  isError: boolean;
  pendingUserId: string | null;
  currentUserId?: string | null;
  onOpenAction: (target: UserActionTarget) => void;
  onRetry: () => void;
};

const ROLE_OPTIONS = [
  { value: "customer", label: "Khách hàng" },
  { value: "mechanic", label: "Thợ" },
  { value: "dispatcher", label: "Điều phối" },
  { value: "admin", label: "Quản trị" },
];

// Every non-trashed account except the current admin, with search plus
// role filter. Search matches name, phone and email; the pager resets
// whenever either filter changes. Other admin accounts stay visible but
// non-actionable.
export function AccountManageList({
  items,
  isPending,
  isError,
  pendingUserId,
  currentUserId,
  onOpenAction,
  onRetry,
}: AccountManageListProps) {
  const [text, setText] = useState("");
  const [role, setRole] = useState("");
  const visible = useMemo(() => {
    const needle = text.trim().toLowerCase();
    return excludeSelfAccount(items, currentUserId).filter((u) => {
      // Trashed accounts live in the trash tab; lock actions reject them.
      if (u.status === "deleted") return false;
      if (role && u.role !== role) return false;
      if (!needle) return true;
      return [u.fullName, u.phone, u.email].some((f) =>
        f.toLowerCase().includes(needle),
      );
    });
  }, [items, text, role, currentUserId]);
  const pager = usePagination(visible.length);

  const handleText = (value: string) => {
    pager.reset();
    setText(value);
  };
  const handleRole = (value: string) => {
    pager.reset();
    setRole(value);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor="admin-user-search"
            className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
          >
            Tìm kiếm
          </label>
          <input
            id="admin-user-search"
            type="search"
            value={text}
            onChange={(e) => handleText(e.target.value)}
            placeholder="Tên, số điện thoại, email…"
            className="mt-1.5 min-h-[44px] w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] dark:focus-visible:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500"
          />
        </div>
        <SelectDropdown
          label="Vai trò"
          value={role}
          options={ROLE_OPTIONS}
          onChange={handleRole}
          allLabel="Mọi vai trò"
          listLabel="Chọn vai trò"
          unitName="vai trò"
          icon={FiUsers}
        />
      </div>

      {isPending ? (
        <ul
          className="divide-y divide-zinc-200 dark:divide-zinc-800"
          aria-label="Đang tải tài khoản"
        >
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex items-center gap-3 py-3">
              <FiLoader
                aria-hidden="true"
                className="h-4 w-4 motion-safe:animate-spin"
              />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Đang tải tài khoản…
              </span>
            </li>
          ))}
        </ul>
      ) : isError ? (
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
      ) : visible.length === 0 ? (
        <StaffEmptyState
          art={STAFF_ART.idCard}
          title="Không tìm thấy tài khoản phù hợp"
          hint="Thử từ khóa hoặc vai trò khác"
        />
      ) : (
        <div className="flex flex-col gap-2">
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {pager.slice(visible).map((item) => (
              <AdminUserCard
                key={item.id}
                user={item}
                pendingUserId={pendingUserId}
                currentUserId={currentUserId}
                actions={item.status === "locked" ? ["unlock"] : ["lock"]}
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
            total={visible.length}
            hrefFor={pager.hrefFor}
          />
        </div>
      )}
    </div>
  );
}
