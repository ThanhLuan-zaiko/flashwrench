"use client";

import { FiAlertCircle, FiLoader, FiX } from "react-icons/fi";
import { SCROLLBAR_CLASSES } from "@/components/ui/scrollbar";
import { useBookingRealtime, useMechanicBooking } from "@/hooks/mechanic";
import { BookingActions } from "./BookingActions";
import { BookingInfo } from "./BookingInfo";

type BookingDetailDialogProps = {
  bookingId: string;
  onClose: () => void;
  onToast: (
    variant: "success" | "error",
    title: string,
    description?: string,
  ) => void;
};

// Dialog owns one booking: customer, vehicle, line items, tracking
// timeline and the next workflow step. Live booking events refresh it.
export function BookingDetailDialog({
  bookingId,
  onClose,
  onToast,
}: BookingDetailDialogProps) {
  const query = useMechanicBooking(bookingId);
  useBookingRealtime(bookingId);
  const booking = query.data?.booking ?? null;

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
        className="fixed inset-0 bg-zinc-950/50"
      />
      <div
        className={`relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-zinc-200 bg-white p-4 sm:rounded-2xl sm:p-5 dark:border-zinc-800 dark:bg-zinc-950 ${SCROLLBAR_CLASSES}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              Chi tiết đơn hàng
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Mã đơn {bookingId.slice(0, 8)}…
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng chi tiết đơn"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <FiX aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        {query.isPending && (
          <div className="mt-6 flex items-center gap-2 text-sm text-zinc-500">
            <FiLoader
              aria-hidden="true"
              className="h-4 w-4 motion-safe:animate-spin"
            />
            Đang tải chi tiết…
          </div>
        )}
        {query.isError && (
          <div className="mt-6 flex flex-col items-center py-6 text-center">
            <FiAlertCircle
              aria-hidden="true"
              className="h-10 w-10 text-zinc-400"
            />
            <p className="mt-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Không tải được chi tiết đơn
            </p>
            <button
              type="button"
              onClick={() => void query.refetch()}
              className="mt-4 flex min-h-[44px] items-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Tải lại
            </button>
          </div>
        )}
        {booking && (
          <div className="mt-3 flex flex-col gap-4">
            <BookingInfo booking={booking} />
            <BookingActions
              booking={booking}
              onClose={onClose}
              onToast={onToast}
            />
          </div>
        )}
      </div>
    </div>
  );
}
