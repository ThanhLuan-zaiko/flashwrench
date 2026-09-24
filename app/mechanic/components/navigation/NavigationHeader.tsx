"use client";

import { FiLoader, FiMapPin, FiNavigation } from "react-icons/fi";

type NavigationHeaderProps = {
  loading: boolean;
  originLabel: string | null;
  jobCount: number;
  locating: boolean;
  canShareRoute: boolean;
  sharingRoute: boolean;
  onShare: () => void;
};

// Header inside the map card: job count, origin label and GPS share button.
export function NavigationHeader({
  loading,
  originLabel,
  jobCount,
  locating,
  canShareRoute,
  sharingRoute,
  onShare,
}: NavigationHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {loading ? "Đang tải bản đồ…" : `${jobCount} điểm cần tới`}
        </h3>
        <p className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
          <FiMapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          {originLabel ?? "Chưa có vị trí xuất phát"}
        </p>
      </div>
      <button
        type="button"
        onClick={onShare}
        disabled={locating}
        aria-pressed={sharingRoute || canShareRoute ? sharingRoute : undefined}
        className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 motion-safe:transition-colors motion-safe:duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 motion-safe:active:scale-[0.98] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        {locating ? (
          <FiLoader
            aria-hidden="true"
            className="h-4 w-4 motion-safe:animate-spin"
          />
        ) : (
          <FiNavigation aria-hidden="true" className="h-4 w-4" />
        )}
        {locating
          ? "Đang định vị…"
          : sharingRoute
            ? "Dừng chia sẻ lộ trình"
            : canShareRoute
              ? "Chia sẻ lộ trình"
              : "Cập nhật vị trí của tôi"}
      </button>
    </div>
  );
}
