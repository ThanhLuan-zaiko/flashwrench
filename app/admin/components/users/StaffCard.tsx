"use client";

import { FiEdit, FiLoader, FiRotateCcw, FiTrash2 } from "react-icons/fi";
import type { AdminUserItem } from "@/lib/auth/admin-users.service";

export type StaffCardVariant = "live" | "trash";

type StaffCardProps = {
  user: AdminUserItem;
  pendingId: string | null;
  variant: StaffCardVariant;
  onEdit?: (item: AdminUserItem) => void;
  onSoft?: (item: AdminUserItem) => void;
  onRestore?: (item: AdminUserItem) => void;
  onHard?: (item: AdminUserItem) => void;
};

const ROLE_LABELS: Record<AdminUserItem["role"], string> = {
  customer: "Khách hàng",
  mechanic: "Thợ",
  dispatcher: "Điều phối",
  admin: "Quản trị",
};

const STATUS_LABELS: Record<AdminUserItem["status"], string> = {
  active: "Đang hoạt động",
  locked: "Bị khóa",
  pending_verification: "Chờ duyệt",
  deleted: "Trong thùng rác",
};

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0]?.[0] ?? "?").toUpperCase();
  return `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase();
}

const BUTTON_CLASS =
  "flex min-h-[44px] items-center gap-1.5 rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-60 motion-safe:active:scale-[0.98] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800";

// One staff row: identity plus role/status pills plus CRUD actions.
// Live rows offer edit + soft delete; trash rows offer restore + hard
// delete. Touch targets stay at least 44px high per bento checklist.
export function StaffCard({
  user,
  pendingId,
  variant,
  onEdit,
  onSoft,
  onRestore,
  onHard,
}: StaffCardProps) {
  const busy = pendingId === user.id;
  const contact = user.phone || user.email;
  const Icon = busy ? FiLoader : FiEdit;

  return (
    <li className="flex flex-col gap-3 px-3 py-3 transition-colors duration-200 hover:bg-zinc-50 sm:flex-row sm:items-center dark:hover:bg-zinc-900">
      <span
        aria-hidden="true"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-sm font-bold text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
      >
        {getInitials(user.fullName)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {user.fullName || "Chưa có tên"}
        </span>
        {contact && (
          <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
            {contact}
            {user.email && user.phone ? ` · ${user.email}` : ""}
          </span>
        )}
        <span className="mt-1.5 flex flex-wrap gap-1.5">
          <span className="rounded-full border border-zinc-200 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
            {ROLE_LABELS[user.role]}
          </span>
          <span className="rounded-full border border-zinc-200 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
            {STATUS_LABELS[user.status]}
          </span>
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
        {variant === "live" ? (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => onEdit?.(user)}
              className={BUTTON_CLASS}
            >
              <Icon
                aria-hidden="true"
                className={`h-3.5 w-3.5 ${busy ? "motion-safe:animate-spin" : ""}`}
              />
              {busy ? "Đang xử lý…" : "Sửa"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onSoft?.(user)}
              className={BUTTON_CLASS}
            >
              <FiTrash2 aria-hidden="true" className="h-3.5 w-3.5" />
              Xóa mềm
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => onRestore?.(user)}
              className={BUTTON_CLASS}
            >
              <FiRotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
              Khôi phục
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onHard?.(user)}
              className={BUTTON_CLASS}
            >
              <FiTrash2 aria-hidden="true" className="h-3.5 w-3.5" />
              Xóa vĩnh viễn
            </button>
          </>
        )}
      </span>
    </li>
  );
}
