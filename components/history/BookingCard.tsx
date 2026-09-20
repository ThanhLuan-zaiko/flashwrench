"use client";

import { FiChevronRight, FiMapPin, FiTool, FiUser } from "react-icons/fi";
import type { BookingSummary } from "@/lib/booking/workspace.types";
import { formatDateTime } from "@/lib/datetime/format";
import { STATUS_LABELS } from "@/lib/mechanic/mechanic-status";
import { paymentStateLabel, statusChipTone } from "./history.utils";

type BookingCardProps = {
  booking: BookingSummary;
  onOpen: () => void;
};

function formatTotal(total: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(total)}đ`;
}

// One history row: what was booked, when, who handles it and the
// payment state. The whole row is the detail trigger.
export function BookingCard({ booking, onOpen }: BookingCardProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Xem chi tiết đơn ${booking.serviceNames.join(", ")}`}
        className="flex w-full flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-left transition-colors duration-200 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.995] dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {booking.serviceNames.join(", ") || "Đơn sửa xe"}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {formatDateTime(booking.scheduledAt, {
                timeZone: booking.timezone,
                withZoneSuffix: false,
              })}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusChipTone(booking.status)}`}
          >
            {STATUS_LABELS[booking.status]}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="inline-flex items-center gap-1">
            <FiUser aria-hidden="true" className="h-3.5 w-3.5" />
            {booking.mechanicName || "Đang tìm thợ"}
          </span>
          <span className="inline-flex items-center gap-1">
            <FiTool aria-hidden="true" className="h-3.5 w-3.5" />
            {booking.vehiclePlate}
          </span>
          <span className="inline-flex min-w-0 items-center gap-1">
            <FiMapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{booking.addressText}</span>
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {paymentStateLabel(booking.paymentState)}
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {formatTotal(booking.total)}
            <FiChevronRight aria-hidden="true" className="h-4 w-4" />
          </span>
        </div>
      </button>
    </li>
  );
}
