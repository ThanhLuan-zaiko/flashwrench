"use client";

import { useState } from "react";
import { FiLoader } from "react-icons/fi";
import { useToast } from "@/components/toast/useToast";
import { useCancelBooking } from "@/hooks/booking";
import { useSessionExpired } from "@/hooks/useSessionExpired";
import type { MechanicBookingStatus } from "@/lib/mechanic/mechanic.types";
import { BookingApiError } from "@/services/booking.api";
import { canCustomerCancelBooking } from "./history.utils";

const MAX_CANCEL_NOTE = 300;

type BookingCancelSectionProps = {
  bookingId: string;
  status: MechanicBookingStatus;
};

// Customer self-cancel inside the booking detail dialog: two-step confirm
// plus a mandatory reason (the server stores it on the shared timeline and
// releases the assigned mechanic). Only pre-departure statuses qualify.
export function BookingCancelSection({
  bookingId,
  status,
}: BookingCancelSectionProps) {
  const [confirming, setConfirming] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const cancelBooking = useCancelBooking();
  const toast = useToast();
  const sessionExpired = useSessionExpired();
  const fieldId = `cancel-note-${bookingId}`;

  if (!canCustomerCancelBooking(status)) return null;

  const cancel = () => {
    const trimmed = note.trim().replace(/\s+/g, " ");
    if (trimmed.length === 0) {
      setError("Vui lòng nhập lý do hủy đơn.");
      return;
    }
    setError("");
    cancelBooking.mutate(
      { bookingId, note: trimmed },
      {
        onSuccess: () => {
          setConfirming(false);
          toast.success("Đã hủy lịch hẹn", "Thợ và cửa hàng đã được báo.");
        },
        onError: (err) => {
          if (sessionExpired(err, "/history")) return;
          setError(
            err instanceof BookingApiError
              ? (err.errors.form ?? "Không hủy được đơn. Vui lòng thử lại.")
              : "Không hủy được đơn. Vui lòng thử lại.",
          );
        },
      },
    );
  };

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex min-h-[44px] w-full items-center justify-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        Hủy lịch hẹn
      </button>
    );
  }

  return (
    <section
      aria-label="Hủy lịch hẹn"
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Hủy lịch hẹn này?
      </p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Voucher đã dùng (nếu có) sẽ được hoàn lại vào ví của bạn.
      </p>
      <label
        htmlFor={fieldId}
        className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
      >
        Lý do hủy (bắt buộc)
      </label>
      <textarea
        id={fieldId}
        value={note}
        maxLength={MAX_CANCEL_NOTE}
        rows={2}
        disabled={cancelBooking.isPending}
        onChange={(event) => {
          setNote(event.target.value);
          if (error) setError("");
        }}
        placeholder="Ví dụ: đổi lịch, đặt nhầm dịch vụ"
        className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors duration-200 hover:border-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:hover:border-zinc-600 dark:focus-visible:ring-offset-zinc-950"
      />
      {error && (
        <p
          role="alert"
          className="text-xs font-medium text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={cancelBooking.isPending}
          onClick={cancel}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:pointer-events-none disabled:opacity-60 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {cancelBooking.isPending && (
            <FiLoader
              aria-hidden="true"
              className="h-4 w-4 motion-safe:animate-spin"
            />
          )}
          Xác nhận hủy
        </button>
        <button
          type="button"
          disabled={cancelBooking.isPending}
          onClick={() => {
            setConfirming(false);
            setError("");
          }}
          className="flex min-h-[44px] items-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Giữ lịch
        </button>
      </div>
    </section>
  );
}
