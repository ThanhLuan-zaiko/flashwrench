"use client";

import { FiClock, FiMapPin, FiPhone } from "react-icons/fi";
import type { MechanicBookingSummary } from "@/services/mechanic.api";
import {
  formatScheduleDateTime,
  formatVnd,
  paymentStateLabel,
  STATUS_LABELS,
  statusTone,
} from "../mechanic-format";

// One row of the work queue: who, where, when, how much, plus the actions
// the current status allows. The full detail lives in the dialog.
export function BookingCard({
  booking,
  onOpen,
}: {
  booking: MechanicBookingSummary;
  onOpen: () => void;
}) {
  const serviceLine =
    booking.serviceNames.length > 0
      ? booking.serviceNames.join(" · ")
      : "Dịch vụ sửa chữa";
  return (
    <li className="flex flex-col gap-3 px-3 py-3 transition-colors duration-200 hover:bg-zinc-50 sm:flex-row sm:items-center dark:hover:bg-zinc-900">
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {booking.customerName || "Khách hàng"}
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusTone(booking.status)}`}
          >
            {STATUS_LABELS[booking.status]}
          </span>
          <span className="rounded-full border border-zinc-200 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
            {paymentStateLabel(booking.paymentState)}
          </span>
        </span>
        <span className="mt-1 block truncate text-xs text-zinc-500 dark:text-zinc-400">
          {serviceLine} · {booking.vehiclePlate}
        </span>
        <span className="mt-1 flex flex-col gap-1 text-xs text-zinc-500 sm:flex-row sm:gap-3 dark:text-zinc-400">
          <span className="flex min-w-0 items-center gap-1">
            <FiMapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {booking.addressText || "Chưa có địa chỉ"}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1">
            <FiClock aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            {formatScheduleDateTime(booking.scheduledAt, booking.timezone)}
          </span>
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
        <span className="mr-1 text-sm font-bold text-zinc-900 dark:text-zinc-50">
          {formatVnd(booking.total)}
        </span>
        {booking.customerPhone && (
          <a
            href={`tel:${booking.customerPhone}`}
            aria-label={`Gọi cho ${booking.customerName}`}
            onClick={(event) => event.stopPropagation()}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-zinc-300 text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <FiPhone aria-hidden="true" className="h-4 w-4" />
          </a>
        )}
        <button
          type="button"
          onClick={onOpen}
          className="flex min-h-[44px] items-center rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.98] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Chi tiết
        </button>
      </span>
    </li>
  );
}
