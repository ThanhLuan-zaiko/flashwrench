// Vietnamese labels + monochrome badges for rescue statuses, shared by
// the customer history tab and any staff surface that needs them.
export const RESCUE_STATUS_LABELS: Record<string, string> = {
  open: "Chờ điều phối",
  dispatched: "Đang gọi thợ",
  accepted: "Thợ đã nhận",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
};

export function rescueStatusLabel(status: string | null): string {
  if (!status) return "Chờ điều phối";
  return RESCUE_STATUS_LABELS[status] ?? status;
}

// Monochrome badges like orderStatusBadgeClass: terminal-cancelled dims,
// completed fills, in-flight states stay neutral bordered.
export function rescueStatusBadgeClass(status: string | null): string {
  const base =
    "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold";
  if (status === "cancelled") {
    return `${base} border-zinc-300 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400`;
  }
  if (status === "completed") {
    return `${base} border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900`;
  }
  return `${base} border-zinc-400 text-zinc-700 dark:border-zinc-600 dark:text-zinc-300`;
}
