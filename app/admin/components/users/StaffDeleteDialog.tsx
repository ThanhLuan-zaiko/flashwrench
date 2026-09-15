"use client";

import {
  FiAlertTriangle,
  FiLoader,
  FiRotateCcw,
  FiTrash2,
  FiX,
} from "react-icons/fi";

export type StaffDeleteTarget = {
  mode: "soft" | "hard";
  id: string;
  fullName: string;
  phone: string;
};

type StaffDeleteDialogProps = {
  target: StaffDeleteTarget | null;
  confirmText: string;
  pending: boolean;
  error: string | null;
  onConfirmText: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

// Shared confirm dialog. Soft delete moves the account to the trash
// (restorable); hard delete is permanent and requires typing the account
// phone number to unlock the button. Mirrors CatalogDeleteDialog.
export function StaffDeleteDialog({
  target,
  confirmText,
  pending,
  error,
  onConfirmText,
  onClose,
  onConfirm,
}: StaffDeleteDialogProps) {
  if (!target) return null;
  const isHard = target.mode === "hard";
  const canConfirm =
    !pending && (!isHard || confirmText.trim() === target.phone);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isHard ? "Xóa vĩnh viễn" : "Xóa mềm"}
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
              {isHard ? (
                <FiTrash2 aria-hidden="true" className="h-4 w-4" />
              ) : (
                <FiAlertTriangle aria-hidden="true" className="h-4 w-4" />
              )}
            </span>
            {isHard ? "Xóa vĩnh viễn tài khoản" : "Xóa mềm tài khoản"}
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
        {target.phone && (
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {target.phone}
          </p>
        )}

        {isHard ? (
          <div className="mt-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              Hành động không thể hoàn tác. Mọi dữ liệu đăng nhập của tài khoản
              này sẽ mất vĩnh viễn.
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Nhập đúng số điện thoại{" "}
              <span className="font-mono font-semibold">{target.phone}</span> để
              xác nhận.
            </p>
            <input
              value={confirmText}
              onChange={(e) => onConfirmText(e.target.value)}
              placeholder={target.phone}
              aria-label="Nhập số điện thoại để xác nhận xóa vĩnh viễn"
              className="mt-2 h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </div>
        ) : (
          <p className="mt-3 rounded-xl bg-zinc-100 px-3 py-2.5 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
            Tài khoản bị đăng xuất khỏi mọi thiết bị và chuyển vào thùng rác.
            Bạn có thể khôi phục bất cứ lúc nào.
          </p>
        )}

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
            disabled={!canConfirm}
            onClick={onConfirm}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {pending ? (
              <FiLoader
                aria-hidden="true"
                className="h-4 w-4 motion-safe:animate-spin"
              />
            ) : (
              <FiTrash2 aria-hidden="true" className="h-4 w-4" />
            )}
            {pending
              ? "Đang xử lý…"
              : isHard
                ? "Xóa vĩnh viễn"
                : "Chuyển vào thùng rác"}
          </button>
        </div>
      </div>
    </div>
  );
}
