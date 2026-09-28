"use client";

import { useId, useState } from "react";
import { FiLoader } from "react-icons/fi";
import {
  useIssueBookingPaymentCode,
  useRecordBookingPayment,
} from "@/hooks/mechanic";
import type { BookingPaymentMethod } from "@/lib/payments/booking-payment.types";
import type { MechanicBookingDetail } from "@/services/mechanic.api";
import { ConfirmCodeField } from "../ConfirmCodeField";
import {
  COLLECT_METHOD_LABELS,
  COLLECT_METHODS,
  canCollectBookingPayment,
  collectPaymentError,
  isValidConfirmCode,
  needsConfirmCode,
  parseCollectAmount,
} from "../collect-payment";
import { formatVnd, paymentStateLabel } from "../mechanic-format";

type BookingCollectSectionProps = {
  booking: MechanicBookingDetail;
  onToast: (
    variant: "success" | "error",
    title: string,
    description?: string,
  ) => void;
};

// Inline collect block inside the booking detail dialog: while a finished
// job still owes money the mechanic picks how the customer paid and how
// much arrived this time (empty amount settles the whole balance).
// Retries reuse the same paymentId so a duplicate submit replays.
export function BookingCollectSection({
  booking,
  onToast,
}: BookingCollectSectionProps) {
  const uid = useId();
  const collect = useRecordBookingPayment();
  const issueCode = useIssueBookingPaymentCode();
  const [method, setMethod] = useState<BookingPaymentMethod>("cod");
  const [amountText, setAmountText] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [error, setError] = useState("");

  if (!canCollectBookingPayment(booking.status, booking.paymentState)) {
    return null;
  }
  const outstanding = booking.paymentOutstanding;
  const parsed = parseCollectAmount(amountText, outstanding);
  const invalidAmount = amountText.trim() !== "" && parsed === null;
  const needsCode = needsConfirmCode(method);
  const codeMissing = needsCode && !isValidConfirmCode(confirmCode);

  const submit = () => {
    setError("");
    const amount = parseCollectAmount(amountText, outstanding);
    if (amount === null) {
      setError(`Nhập số tiền hợp lệ, tối đa ${formatVnd(outstanding)}.`);
      return;
    }
    if (codeMissing) {
      setError("Nhập đủ mã 6 số khách đọc cho bạn.");
      return;
    }
    const id = paymentId || crypto.randomUUID();
    collect.mutate(
      {
        bookingId: booking.id,
        input: {
          method,
          amount,
          paymentId: id,
          confirmCode: needsCode ? confirmCode.trim() : undefined,
        },
      },
      {
        onSuccess: ({ payment }) => {
          setPaymentId("");
          setAmountText("");
          setConfirmCode("");
          onToast(
            "success",
            payment.paymentStatus === "paid"
              ? "Đã thu đủ tiền đơn hàng"
              : "Đã ghi nhận thu một phần",
            `${formatVnd(payment.amount)} · còn lại ${formatVnd(payment.outstanding)}.`,
          );
        },
        onError: (err) => {
          setPaymentId(id);
          setError(collectPaymentError(err));
        },
      },
    );
  };

  return (
    <section
      aria-label="Thu tiền"
      className="rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Thu tiền
        </h3>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          {paymentStateLabel(booking.paymentState)}
        </p>
      </div>
      {booking.paymentReceived > 0 && (
        <p className="mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
          Đã thu {formatVnd(booking.paymentReceived)} /{" "}
          {formatVnd(booking.total)}
        </p>
      )}
      <label
        htmlFor={`${uid}-amount`}
        className="mt-2 block text-[11px] font-medium text-zinc-500 dark:text-zinc-400"
      >
        Số tiền lần này — để trống thu đủ {formatVnd(outstanding)}
      </label>
      <input
        id={`${uid}-amount`}
        type="text"
        inputMode="numeric"
        value={amountText}
        disabled={collect.isPending}
        onChange={(event) => setAmountText(event.target.value)}
        placeholder={formatVnd(outstanding)}
        className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm tabular-nums text-zinc-900 outline-none transition-colors focus:border-zinc-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-400"
      />
      <div className="mt-2 grid grid-cols-2 gap-2">
        {COLLECT_METHODS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={method === option}
            disabled={collect.isPending}
            onClick={() => setMethod(option)}
            className={`flex min-h-[44px] items-center justify-center rounded-xl border px-3 py-2 text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 motion-safe:active:scale-[0.99] ${
              method === option
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            }`}
          >
            {COLLECT_METHOD_LABELS[option]}
          </button>
        ))}
      </div>
      {needsCode && (
        <ConfirmCodeField
          id={`${uid}-code`}
          value={confirmCode}
          disabled={collect.isPending}
          issuePending={issueCode.isPending}
          issued={issueCode.isSuccess}
          onChange={setConfirmCode}
          onIssue={() => {
            issueCode.mutate(booking.id, {
              onSuccess: () =>
                onToast(
                  "success",
                  "Đã gửi mã xác nhận",
                  "Khách sẽ thấy mã 6 số trong chi tiết đơn của họ.",
                ),
              onError: (err) => setError(collectPaymentError(err)),
            });
          }}
        />
      )}
      {error && (
        <p
          role="alert"
          className="mt-2 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </p>
      )}
      <button
        type="button"
        disabled={collect.isPending || invalidAmount || codeMissing}
        onClick={submit}
        className="mt-2 flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border border-zinc-900 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 motion-safe:active:scale-[0.99] dark:border-white dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
      >
        {collect.isPending && (
          <FiLoader
            aria-hidden="true"
            className="h-4 w-4 motion-safe:animate-spin"
          />
        )}
        Xác nhận đã thu · {formatVnd(parsed ?? outstanding)}
      </button>
    </section>
  );
}
