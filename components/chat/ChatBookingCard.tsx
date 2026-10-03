"use client";

import { FiClipboard, FiRefreshCw } from "react-icons/fi";
import { useChatBookings } from "@/hooks/chat";

const STATUS_LABELS: Record<string, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  mechanic_assigned: "Đã giao thợ",
  en_route: "Thợ đang tới",
  in_progress: "Đang sửa",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
  no_show: "Khách vắng mặt",
};

function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

function formatSchedule(iso: string | null): string {
  if (!iso) return "Chưa hẹn giờ";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Chưa hẹn giờ";
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

function formatTotal(total: number): string {
  return `${total.toLocaleString("vi-VN")}đ`;
}

// Compact booking strip pinned above the message list so both sides see
// which jobs this pair shares without leaving the conversation.
export function ChatBookingCard({ threadId }: { threadId: string }) {
  const bookings = useChatBookings(threadId, true);

  if (bookings.isPending) {
    return (
      <div className="shrink-0 border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
        <div className="h-9 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
      </div>
    );
  }
  if (bookings.isError) {
    return (
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
          Không tải được đơn liên quan.
        </p>
        <button
          type="button"
          onClick={() => void bookings.refetch()}
          aria-label="Tải lại đơn liên quan"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <FiRefreshCw className="h-4 w-4" aria-hidden />
        </button>
      </div>
    );
  }
  const items = bookings.data ?? [];
  if (items.length === 0) return null;

  return (
    <div className="shrink-0 border-b border-zinc-200 bg-zinc-50/60 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="px-1 pb-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Đơn liên quan ({items.length})
      </p>
      <ul className="space-y-1.5">
        {items.map((booking) => (
          <li
            key={booking.id}
            className="flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              <FiClipboard className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-2">
                <span className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  {booking.vehiclePlate || "Chưa có biển số"}
                </span>
                <span className="shrink-0 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  {statusLabel(booking.status)}
                </span>
              </span>
              <span className="mt-0.5 flex items-baseline justify-between gap-2">
                <span className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                  {formatSchedule(booking.scheduledAt)}
                </span>
                <span className="shrink-0 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                  {formatTotal(booking.total)}
                </span>
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
