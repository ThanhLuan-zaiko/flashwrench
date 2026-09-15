"use client";

import { FiCheck, FiLoader, FiLock, FiUnlock } from "react-icons/fi";
import type {
  AdminUserAction,
  AdminUserItem,
} from "@/lib/auth/admin-users.service";
import { getProtectionReason } from "./admin-user-guards";

type AdminUserCardProps = {
  user: AdminUserItem;
  pendingUserId: string | null;
  actions: AdminUserAction[];
  currentUserId?: string | null;
  onAction: (userId: string, action: AdminUserAction) => void;
};

const ACTION_META: Record<
  AdminUserAction,
  { label: string; pendingLabel: string; icon: typeof FiCheck }
> = {
  approve: { label: "Duyệt", pendingLabel: "Đang duyệt…", icon: FiCheck },
  lock: { label: "Khóa", pendingLabel: "Đang khóa…", icon: FiLock },
  unlock: { label: "Mở khóa", pendingLabel: "Đang mở…", icon: FiUnlock },
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

// Row owns one user: identity plus role/status pills plus actions.
// Touch targets stay at least 44px high per bento checklist.
// The current admin can never act on their own account or on any other
// admin account (backend returns 403), so those rows show an explanatory
// note instead of action buttons.
export function AdminUserCard({
  user,
  pendingUserId,
  actions,
  currentUserId,
  onAction,
}: AdminUserCardProps) {
  const busy = pendingUserId === user.id;
  const contact = user.phone || user.email;
  const protection = getProtectionReason(currentUserId, user);

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
        {protection === "self" ? (
          <span className="rounded-full border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            Đây là bạn
          </span>
        ) : protection === "admin" ? (
          <span className="rounded-full border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            Tài khoản quản trị
          </span>
        ) : (
          actions.map((action) => {
            const meta = ACTION_META[action];
            const Icon = busy ? FiLoader : meta.icon;
            return (
              <button
                key={action}
                type="button"
                disabled={busy}
                onClick={() => onAction(user.id, action)}
                className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-60 motion-safe:active:scale-[0.98] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <Icon
                  aria-hidden="true"
                  className={`h-3.5 w-3.5 ${busy ? "motion-safe:animate-spin" : ""}`}
                />
                {busy ? meta.pendingLabel : meta.label}
              </button>
            );
          })
        )}
      </span>
    </li>
  );
}
