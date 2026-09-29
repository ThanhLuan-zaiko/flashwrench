"use client";

import { FiLoader } from "react-icons/fi";

// Single frame shown while a deep `/page/N` that the cursor walk never
// reached bounces back to the list root (the replace happens inside
// useCursorRoutePage). Kept as a spinner so the flash reads as loading.
export function PageBounce() {
  return (
    <div
      className="flex items-center justify-center py-8"
      aria-live="polite"
      aria-busy="true"
    >
      <FiLoader
        aria-hidden="true"
        className="h-8 w-8 text-zinc-400 motion-safe:animate-spin dark:text-zinc-500"
      />
      <span className="sr-only">Đang chuyển về trang đầu…</span>
    </div>
  );
}
