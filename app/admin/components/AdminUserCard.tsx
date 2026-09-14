"use client";

import { FiCheck, FiLoader, FiLock, FiUnlock } from "react-icons/fi";
import type {
  AdminUserAction,
  AdminUserItem,
} from "@/lib/auth/admin-users.service";

type AdminUserCardProps = {
  user: AdminUserItem;
  pendingUserId: string | null;
  actions: AdminUserAction[];
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

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0]?.[0] ?? "?").toUpperCase();
  return `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase();
}

export function AdminUserCard({
  user,
  pendingUserId,
  actions,
  onAction,
}: AdminUserCardProps) {
  const busy = pendingUserId === user.id;
  const contact = user.phone || user.email;

  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
      <span
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 text-sm font-bold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
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
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
        {actions.map((action) => {
          const meta = ACTION_META[action];
          const Icon = busy ? FiLoader : meta.icon;
          return (
            <button
              key={action}
              type="button"
              disabled={busy}
              onClick={() => onAction(user.id, action)}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-60 motion-safe:active:scale-[0.98] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <Icon
                aria-hidden="true"
                className={`h-3.5 w-3.5 ${busy ? "motion-safe:animate-spin" : ""}`}
              />
              {busy ? meta.pendingLabel : meta.label}
            </button>
          );
        })}
      </span>
    </li>
  );
}
