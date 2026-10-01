"use client";

import { FiLoader, FiXCircle } from "react-icons/fi";

// Small shared states for the public tracking screens.
export function TrackLoading() {
  return (
    <p className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
      <FiLoader
        aria-hidden="true"
        className="h-4 w-4 motion-safe:animate-spin"
      />
      Đang tải tiến trình…
    </p>
  );
}

export function TrackError() {
  return (
    <p className="text-xs text-zinc-500 dark:text-zinc-400">
      Không tải được tiến trình. Trang sẽ tự thử lại — hoặc gọi hotline để được
      hỗ trợ.
    </p>
  );
}

export function TrackAborted({
  title,
  body,
}: {
  title: string;
  body?: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-zinc-300 bg-zinc-50 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-900">
      <FiXCircle
        aria-hidden="true"
        className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400"
      />
      <div className="flex flex-col gap-0.5">
        <p className="font-medium text-zinc-700 dark:text-zinc-300">{title}</p>
        {body ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{body}</p>
        ) : null}
      </div>
    </div>
  );
}
