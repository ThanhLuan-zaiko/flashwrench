"use client";

import { FiAlertTriangle, FiX } from "react-icons/fi";
import { DIALOG_OVERLAY_NESTED_CLASSES } from "@/components/ui/dialog-overlay";

type ConfirmDiscardDialogProps = {
  open: boolean;
  title?: string;
  body?: string;
  stayLabel?: string;
  discardLabel?: string;
  onStay: () => void;
  onDiscard: () => void;
};

// Branded unsaved-changes confirm for in-app leaves (dialog chrome,
// tab switches, sidebar links). Renders above form dialogs (z-60) with
// the same monochrome surface as CatalogDeleteDialog. True unloads
// (F5, tab close) still use the native prompt: browsers forbid custom
// UI while the document unloads.
export function ConfirmDiscardDialog({
  open,
  title = "Bỏ các thay đổi chưa lưu?",
  body = "Những gì đã nhập mà chưa bấm lưu sẽ bị mất.",
  stayLabel = "Ở lại nhập tiếp",
  discardLabel = "Bỏ thay đổi",
  onStay,
  onDiscard,
}: ConfirmDiscardDialogProps) {
  if (!open) return null;
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
      className={DIALOG_OVERLAY_NESTED_CLASSES}
    >
      <button
        type="button"
        aria-label="Ở lại"
        onClick={onStay}
        className="fixed inset-0 bg-zinc-950/50"
      />
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-50">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-900">
              <FiAlertTriangle aria-hidden="true" className="h-4 w-4" />
            </span>
            {title}
          </p>
          <button
            type="button"
            onClick={onStay}
            aria-label="Đóng hộp thoại, ở lại"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <FiX aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-3 rounded-xl bg-zinc-100 px-3 py-2.5 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
          {body}
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onStay}
            className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {stayLabel}
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {discardLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
