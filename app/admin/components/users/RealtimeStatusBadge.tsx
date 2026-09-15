"use client";

import { useRealtimeStatus } from "@/hooks/useRealtimeStatus";

// Monochrome connection badge for realtime features. Filled dot means the
// gateway socket is live; otherwise updates arrive only after refetch, so
// the admin knows to start the gateway (`bun run dev:all`).
export function RealtimeStatusBadge() {
  const status = useRealtimeStatus();
  const live = status === "live";

  return (
    <output
      aria-label={live ? "Realtime đang hoạt động" : "Realtime mất kết nối"}
      className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400"
    >
      <span
        aria-hidden="true"
        className={`h-2 w-2 rounded-full ${
          live
            ? "bg-zinc-900 dark:bg-white"
            : "border border-zinc-400 dark:border-zinc-500"
        }`}
      />
      {live ? "Trực tiếp" : "Mất kết nối realtime"}
    </output>
  );
}
