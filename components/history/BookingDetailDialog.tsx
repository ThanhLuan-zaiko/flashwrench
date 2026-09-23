"use client";

import dynamic from "next/dynamic";
import {
  FiAlertCircle,
  FiLoader,
  FiMapPin,
  FiStar,
  FiUser,
  FiX,
} from "react-icons/fi";
import { SCROLLBAR_CLASSES } from "@/components/ui/scrollbar";
import { useMyBooking } from "@/hooks/booking";
import { formatDateTime } from "@/lib/datetime/format";
import { STATUS_LABELS } from "@/lib/mechanic/mechanic-status";
import { BookingTimeline } from "./BookingTimeline";
import {
  isTrackableStatus,
  paymentStateLabel,
  statusChipTone,
  trackingHeadline,
} from "./history.utils";

const TrackingMap = dynamic(
  () => import("./TrackingMap").then((module) => module.TrackingMap),
  { ssr: false },
);

type BookingDetailDialogProps = {
  bookingId: string;
  onClose: () => void;
};

function formatTotal(total: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(total)}đ`;
}

// Customer-facing booking detail: status timeline, line items, payment
// state and — while the mechanic is en route or working — a live map.
export function BookingDetailDialog({
  bookingId,
  onClose,
}: BookingDetailDialogProps) {
  const query = useMyBooking(bookingId, true);
  const booking = query.data ?? null;
  const showLiveMap = Boolean(
    booking && isTrackableStatus(booking.status) && booking.location !== null,
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Chi tiết đơn hàng"
      className="fixed inset-0 z-50 flex h-dvh items-end justify-center p-0 sm:items-center sm:p-4"
    >
      <button
        type="button"
        aria-label="Đóng chi tiết đơn"
        onClick={onClose}
        className="absolute inset-0 bg-zinc-950/50"
      />
      <div
        className={`relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-zinc-200 bg-white sm:rounded-2xl dark:border-zinc-800 dark:bg-zinc-950`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Chi tiết đơn hàng
            </h2>
            {booking && (
              <span
                className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusChipTone(booking.status)}`}
              >
                {STATUS_LABELS[booking.status]}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors duration-200 hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <FiX aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <div
          className={`flex-1 overflow-y-auto px-5 py-4 ${SCROLLBAR_CLASSES}`}
        >
          {query.isPending && (
            <div
              aria-busy="true"
              className="flex items-center justify-center gap-2 py-10 text-sm text-zinc-500 dark:text-zinc-400"
            >
              <FiLoader aria-hidden="true" className="h-4 w-4 animate-spin" />
              Đang tải chi tiết đơn…
            </div>
          )}

          {query.isError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
            >
              <FiAlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4" />
              Không tải được chi tiết đơn. Vui lòng thử lại.
            </div>
          )}

          {booking && (
            <div className="flex flex-col gap-5">
              <section
                aria-label="Thông tin đơn"
                className="flex flex-col gap-2"
              >
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {booking.serviceNames.join(", ") || "Đơn sửa xe"}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {formatDateTime(booking.scheduledAt, {
                    timeZone: booking.timezone,
                    withZoneSuffix: false,
                  })}
                </p>
                <p className="flex items-start gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  <FiMapPin
                    aria-hidden="true"
                    className="mt-0.5 h-3.5 w-3.5 shrink-0"
                  />
                  {booking.addressText}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  <FiUser aria-hidden="true" className="h-3.5 w-3.5" />
                  {booking.mechanicName || "Đang tìm thợ phù hợp"}
                </p>
              </section>

              {showLiveMap && booking.location && (
                <section
                  aria-label="Vị trí thợ"
                  className="flex flex-col gap-2"
                >
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {trackingHeadline(booking.status)}
                  </p>
                  <TrackingMap
                    mechanic={{
                      lat: booking.location.lat,
                      lng: booking.location.lng,
                    }}
                    customer={
                      booking.addressLat !== null && booking.addressLng !== null
                        ? { lat: booking.addressLat, lng: booking.addressLng }
                        : null
                    }
                  />
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Cập nhật{" "}
                    {formatDateTime(booking.location.updatedAt, {
                      withZoneSuffix: false,
                    })}
                  </p>
                </section>
              )}

              <section
                aria-label="Dịch vụ đã đặt"
                className="flex flex-col gap-2"
              >
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  Dịch vụ
                </p>
                <ul className="flex flex-col gap-1.5">
                  {booking.items.map((item) => (
                    <li
                      key={item.serviceId}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="text-zinc-600 dark:text-zinc-300">
                        {item.serviceName}
                        {item.quantity > 1 ? ` ×${item.quantity}` : ""}
                      </span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">
                        {formatTotal(item.lineTotal)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-1 flex items-center justify-between border-t border-zinc-200 pt-2 dark:border-zinc-800">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    Tổng cộng
                  </span>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {formatTotal(booking.total)}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {paymentStateLabel(booking.paymentState)}
                </p>
              </section>

              {booking.cancelReason && (
                <p className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                  Lý do hủy: {booking.cancelReason}
                </p>
              )}

              {booking.review && (
                <p className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                  <FiStar aria-hidden="true" className="h-3.5 w-3.5" />
                  Bạn đã đánh giá {booking.review.rating}/5
                  {booking.review.body ? ` — ${booking.review.body}` : ""}
                </p>
              )}

              <section
                aria-label="Tiến trình đơn"
                className="flex flex-col gap-2"
              >
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  Tiến trình
                </p>
                <BookingTimeline timeline={booking.timeline} />
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
