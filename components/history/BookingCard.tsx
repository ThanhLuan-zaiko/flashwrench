"use client";

import { FiChevronRight } from "react-icons/fi";
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

// One booking in the history list: a ruled row. The selected row takes a
// tinted surface; the footer keeps the payment state, total and the detail link.
export function BookingCard({
  booking,
  selected,
  onSelect,
  onOpen,
}: BookingCardProps) {
  return (
    <li
      className={`border-b border-zinc-200 dark:border-zinc-800 ${
        selected ? "bg-zinc-50 dark:bg-zinc-900" : ""
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={`Chọn đơn ${booking.serviceNames.join(", ")}`}
        className="flex w-full flex-col gap-2 py-4 text-left motion-safe:transition-colors motion-safe:duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] dark:focus-visible:ring-zinc-100"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">
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

        <div className="flex flex-col gap-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          <p className="truncate">
            Thợ: {booking.mechanicName || "Đang tìm thợ"}
          </p>
          <p className="truncate">Xe: {booking.vehiclePlate}</p>
          <p className="truncate">{booking.addressText}</p>
        </div>
      </button>

      <div className="flex items-center justify-between gap-3 pb-3">
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
            className="flex min-h-11 items-center gap-1 text-xs font-bold text-[#1D4ED8] underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] dark:text-blue-300"
          >
            Chi tiết
            <FiChevronRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </li>
  );
}
