"use client";

import { useEffect, useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiInfo, FiX } from "react-icons/fi";
import type { ToastItem, ToastVariant } from "./toast.types";

const EXIT_MS = 300;

function ToastIcon({ variant }: { variant: ToastVariant }) {
  const className = "h-5 w-5 shrink-0 text-zinc-700 dark:text-zinc-200";
  if (variant === "success")
    return <FiCheckCircle aria-hidden="true" className={className} />;
  if (variant === "error")
    return <FiAlertCircle aria-hidden="true" className={className} />;
  return <FiInfo aria-hidden="true" className={className} />;
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = requestAnimationFrame(() => setVisible(true));
    const hideAt = Math.max(0, toast.durationMs - EXIT_MS);
    const hideTimer = setTimeout(() => setVisible(false), hideAt);
    const removeTimer = setTimeout(() => onDismiss(toast.id), toast.durationMs);
    return () => {
      cancelAnimationFrame(show);
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, [toast.id, toast.durationMs, onDismiss]);

  return (
    <output
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-lg motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out dark:border-zinc-800 dark:bg-zinc-900 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <ToastIcon variant={toast.variant} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {toast.title}
        </p>
        {toast.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
            {toast.description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Đóng thông báo"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors duration-200 hover:bg-zinc-100 motion-safe:active:scale-95 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        <FiX aria-hidden="true" className="h-4 w-4" />
      </button>
    </output>
  );
}

export function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
