"use client";

import { FiAlertTriangle, FiX } from "react-icons/fi";
import { DIALOG_OVERLAY_NESTED_CLASSES } from "@/components/ui/dialog-overlay";
import { useDialogFocus } from "@/hooks/useDialogFocus";

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
  const dialogRef = useDialogFocus<HTMLDivElement>(onStay);
  if (!open) return null;
  return (
    <div
      ref={dialogRef}
      role="alertdialog"
      tabIndex={-1}
      aria-modal="true"
      aria-label={title}
      className={DIALOG_OVERLAY_NESTED_CLASSES}
    >
      <button
        type="button"
        aria-label="Ở lại"
        onClick={onStay}
        className="fixed inset-0 bg-[#111111]/50"
      />
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-50">
            <FiAlertTriangle aria-hidden="true" className="h-5 w-5 shrink-0" />
            {title}
          </p>
          <button
            type="button"
            onClick={onStay}
            aria-label="Đóng hộp thoại, ở lại"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-zinc-600 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <FiX aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-3 text-xs text-zinc-800 dark:text-zinc-300">{body}</p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onStay}
            className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] bg-[#1D4ED8] text-white hover:bg-[#1E40AF] dark:bg-[#60A5FA] dark:text-[#111111] dark:hover:bg-[#93C5FD]"
          >
            {stayLabel}
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-zinc-600 px-4 py-2.5 text-sm font-semibold text-[#111111] transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-400 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            {discardLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
