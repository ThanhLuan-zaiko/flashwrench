"use client";

import {
  FiCheck,
  FiLoader,
  FiLock,
  FiRotateCcw,
  FiUnlock,
  FiX,
} from "react-icons/fi";
import type { UserActionTarget } from "./useUserRowActions";

type UserActionDialogProps = {
  target: UserActionTarget | null;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

const ACTION_COPY = {
  approve: {
    title: "Duyệt thợ",
    detail:
      "Hồ sơ đạt yêu cầu sẽ được kích hoạt. Thợ đăng nhập và nhận việc ngay.",
    confirm: "Duyệt thợ",
    icon: FiCheck,
  },
  lock: {
    title: "Khóa tài khoản",
    detail: "Tài khoản bị đăng xuất khỏi mọi thiết bị và tạm dừng mọi dịch vụ.",
    confirm: "Khóa tài khoản",
    icon: FiLock,
  },
  unlock: {
    title: "Mở khóa tài khoản",
    detail: "Tài khoản hoạt động lại bình thường trên mọi dịch vụ.",
    confirm: "Mở khóa",
    icon: FiUnlock,
  },
} as const;

// Shared confirm dialog for approve/lock/unlock. Mirrors the catalog
// delete dialog: backdrop close, inline error, disabled confirm.
export function UserActionDialog({
  target,
  pending,
  error,
  onClose,
  onConfirm,
}: UserActionDialogProps) {
  if (!target) return null;
  const copy = ACTION_COPY[target.action];
  const Icon = copy.icon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={copy.title}
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
    >
      <button
        type="button"
        aria-label="Đóng hộp thoại"
        onClick={onClose}
        className="fixed inset-0 bg-zinc-950/50"
      />
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-50">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-900">
              <Icon aria-hidden="true" className="h-4 w-4" />
            </span>
            {copy.title}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-500 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <FiX aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {target.fullName || "Chưa có tên"}
        </p>
        <p className="mt-3 rounded-xl bg-zinc-100 px-3 py-2.5 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
          {copy.detail}
        </p>

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            {error}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <FiRotateCcw aria-hidden="true" className="h-4 w-4" />
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {pending ? (
              <FiLoader
                aria-hidden="true"
                className="h-4 w-4 motion-safe:animate-spin"
              />
            ) : (
              <Icon aria-hidden="true" className="h-4 w-4" />
            )}
            {pending ? "Đang xử lý…" : copy.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
