"use client";

import { FiClock, FiMapPin, FiPhone, FiTool, FiUser } from "react-icons/fi";
import type { BookingDetail } from "@/services/dispatch.api";
import {
  DISPATCH_STATUS_LABELS,
  formatScheduleDateTime,
  formatShortDate,
  formatVnd,
  mechanicLabel,
  openStreetMapUrl,
  paymentStateLabel,
  statusTone,
} from "./dispatch-format";

// Read-only facts for the dispatcher: customer, vehicle, schedule, assigned
// mechanic, line items, cancel reason and the tracking timeline.
export function DispatchBookingInfo({ booking }: { booking: BookingDetail }) {
  const mapUrl = openStreetMapUrl(booking.addressLat, booking.addressLng);
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800">
        <p className="flex flex-wrap items-center gap-1.5">
          <span
            className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusTone(booking.status)}`}
          >
            {DISPATCH_STATUS_LABELS[booking.status]}
          </span>
          <span className="rounded-full border border-zinc-200 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
            {paymentStateLabel(booking.paymentState)}
          </span>
        </p>
        <p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {booking.customerName || "Khách hàng"}
        </p>
        <div className="mt-1.5 flex flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1.5">
            <FiUser aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            {booking.vehicleBrand} {booking.vehicleModel} ·{" "}
            {booking.vehiclePlate}
          </span>
          <span className="flex items-start gap-1.5">
            <FiMapPin
              aria-hidden="true"
              className="mt-0.5 h-3.5 w-3.5 shrink-0"
            />
            {booking.addressText || "Chưa có địa chỉ"}
          </span>
          <span className="flex items-center gap-1.5">
            <FiClock aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            Hẹn {formatScheduleDateTime(booking.scheduledAt, booking.timezone)}
          </span>
          <span className="flex items-center gap-1.5">
            <FiTool aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            Thợ phụ trách: {mechanicLabel(booking.mechanicName)}
          </span>
          {booking.notes && (
            <span className="rounded-xl bg-zinc-100 px-2.5 py-2 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              Ghi chú: {booking.notes}
            </span>
          )}
          {booking.cancelReason && (
            <span className="rounded-xl bg-zinc-100 px-2.5 py-2 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              Lý do hủy: {booking.cancelReason}
            </span>
          )}
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          {booking.customerPhone && (
            <a
              href={`tel:${booking.customerPhone}`}
              className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition-colors duration-200 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              <FiPhone aria-hidden="true" className="h-4 w-4" />
              Gọi {booking.customerPhone}
            </a>
          )}
          {mapUrl && (
            <a
              href={mapUrl}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition-colors duration-200 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              <FiMapPin aria-hidden="true" className="h-4 w-4" />
              Mở bản đồ
            </a>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
          Dịch vụ ({booking.items.length})
        </h3>
        <ul className="mt-2 divide-y divide-zinc-200 rounded-2xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {booking.items.map((item) => (
            <li
              key={item.serviceId}
              className="flex items-center justify-between gap-2 px-3 py-2.5"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {item.serviceName}
                </span>
                <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                  {formatVnd(item.unitPrice)} × {item.quantity}
                </span>
              </span>
              <span className="shrink-0 text-sm font-bold text-zinc-900 dark:text-zinc-50">
                {formatVnd(item.lineTotal)}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 flex items-center justify-between text-sm">
          <span className="font-medium text-zinc-600 dark:text-zinc-400">
            Tổng thu dự kiến
          </span>
          <span className="font-bold text-zinc-900 dark:text-zinc-50">
            {formatVnd(booking.total)}
          </span>
        </p>
      </div>

      <div>
        <h3 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
          Lịch sử trạng thái
        </h3>
        {booking.timeline.length === 0 ? (
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Chưa có lịch sử thay đổi trạng thái.
          </p>
        ) : (
          <ol className="mt-2 flex flex-col gap-2">
            {booking.timeline.map((entry, index) => (
              <li
                key={`${entry.at ?? "none"}-${entry.to}-${index}`}
                className="flex items-start gap-2 text-xs"
              >
                <span
                  aria-hidden="true"
                  className="mt-1 h-2 w-2 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-500"
                />
                <span className="min-w-0">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {DISPATCH_STATUS_LABELS[entry.to]}
                  </span>
                  <span className="block text-zinc-500 dark:text-zinc-400">
                    {formatShortDate(entry.at)}
                    {entry.note ? ` · ${entry.note}` : ""}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
