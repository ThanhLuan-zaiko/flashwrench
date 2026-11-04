// Vietnamese labels + monochrome badges for rescue statuses, shared by
// the customer history tab and any staff surface that needs them.
export const RESCUE_STATUS_LABELS: Record<string, string> = {
  open: "Chờ điều phối",
  dispatched: "Đang gọi thợ",
  accepted: "Thợ đã nhận",
  en_route: "Đang di chuyển",
  arrived: "Đã đến nơi",
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
    "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold";
  if (status === "cancelled") {
    return `${base} border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400`;
  }
  if (status === "completed") {
    return `${base} border-[#111111] bg-[#FB923C] text-[#111111] dark:border-[#FB923C] dark:bg-[#FB923C] dark:text-[#111111]`;
  }
  return `${base} border-zinc-400 text-zinc-800 dark:border-zinc-600 dark:text-zinc-300`;
}
