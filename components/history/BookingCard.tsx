"use client";

import { FiChevronRight, FiMapPin, FiTool, FiUser } from "react-icons/fi";
import type { BookingSummary } from "@/lib/booking/workspace.types";
import { formatDateTime } from "@/lib/datetime/format";
import { STATUS_LABELS } from "@/lib/mechanic/mechanic-status";
import { paymentStateLabel, statusChipTone } from "./history.utils";

type BookingCardProps = {
  booking: BookingSummary;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
};

function formatTotal(total: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(total)}đ`;
}

export function BookingCard({
  booking,
  selected,
  onSelect,
  onOpen,
}: BookingCardProps) {
  const selectedTone = selected
    ? "border-zinc-900 dark:border-white"
    : "border-zinc-200 dark:border-zinc-800";

  return (
    <li>
      <div className={`rounded-2xl border bg-white dark:bg-zinc-950 ${selectedTone}`}>
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          aria-label={`Chọn đơn ${booking.serviceNames.join(", ")}`}
          className="flex w-full flex-col gap-3 rounded-t-2xl p-4 text-left motion-safe:transition-colors motion-safe:duration-200 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.995] dark:hover:bg-zinc-900"
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
        </button>

        <div className="flex items-center justify-between gap-3 border-t border-zinc-100 px-4 py-2.5 dark:border-zinc-800">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {paymentStateLabel(booking.paymentState)}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
              {formatTotal(booking.total)}
            </span>
            <button
              type="button"
              onClick={onOpen}
              className="flex min-h-[44px] items-center gap-1 text-xs font-semibold text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:text-zinc-200"
            >
              Chi tiết
              <FiChevronRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
