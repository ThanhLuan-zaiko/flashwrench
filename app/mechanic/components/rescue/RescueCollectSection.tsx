"use client";

import { useId, useState } from "react";
import { FiLoader } from "react-icons/fi";
import {
  useIssueRescuePaymentCode,
  useRecordRescuePayment,
} from "@/hooks/rescue-inbox";
import type { BookingPaymentMethod } from "@/lib/payments/booking-payment.types";
import type { RescueDetail } from "@/services/rescue-mechanic.api";
import { ConfirmCodeField } from "../ConfirmCodeField";
import {
  COLLECT_METHOD_LABELS,
  COLLECT_METHODS,
  collectPaymentError,
  isValidConfirmCode,
  needsConfirmCode,
} from "../collect-payment";
import { formatVnd } from "../mechanic-format";

// Collect block on a completed-but-unpaid rescue card: the mechanic records
// the on-scene payment. Same cash-code guard as bookings; the card leaves
// the inbox once the server flips payment_status.
export function RescueCollectSection({ rescue }: { rescue: RescueDetail }) {
  const uid = useId();
  const collect = useRecordRescuePayment();
  const issueCode = useIssueRescuePaymentCode();
  const [method, setMethod] = useState<BookingPaymentMethod>("cod");
  const [confirmCode, setConfirmCode] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [error, setError] = useState("");

  const amount = rescue.finalPrice ?? rescue.priceEstimate;
  const collectable =
    rescue.status === "completed" &&
    rescue.paymentStatus === "unpaid" &&
    amount !== null;
  if (!collectable) return null;

  const needsCode = needsConfirmCode(method);
  const codeMissing = needsCode && !isValidConfirmCode(confirmCode);

  const submit = () => {
    setError("");
    if (codeMissing) {
      setError("Nhập đủ mã 6 số khách đọc cho bạn.");
      return;
    }
    const id = paymentId || crypto.randomUUID();
    collect.mutate(
      {
        requestId: rescue.requestId,
        input: {
          method,
          paymentId: id,
          confirmCode: needsCode ? confirmCode.trim() : undefined,
        },
      },
      {
        onError: (err) => {
          setPaymentId(id);
          setError(collectPaymentError(err));
        },
      },
    );
  };

  return (
    <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-300">
          Thu tiền cứu hộ
        </p>
        <p className="text-sm font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
          {formatVnd(amount)}
        </p>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {COLLECT_METHODS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={method === option}
            disabled={collect.isPending}
            onClick={() => setMethod(option)}
            className={`flex min-h-[44px] items-center justify-center rounded-xl border px-3 py-2 text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] dark:focus-visible:ring-zinc-400 disabled:opacity-60 motion-safe:active:scale-[0.99] ${
              method === option
                ? "border-[#111111] bg-[#FB923C] text-[#111111] dark:border-[#FB923C] dark:bg-[#FB923C] dark:text-[#111111]"
                : "border-zinc-500 text-zinc-800 hover:bg-zinc-100 dark:border-zinc-500 dark:text-zinc-200 dark:hover:bg-zinc-800"
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
          onIssue={() => issueCode.mutate(rescue.requestId)}
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
        disabled={collect.isPending || codeMissing}
        onClick={submit}
        className="mt-2 inline-flex min-h-[44px] items-center justify-center self-start gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950 dark:focus-visible:ring-zinc-400 disabled:opacity-60 motion-safe:active:scale-[0.99] bg-[#1D4ED8] text-white hover:bg-[#1E40AF] dark:bg-[#60A5FA] dark:text-[#111111] dark:hover:bg-[#93C5FD]"
      >
        {collect.isPending && (
          <FiLoader
            aria-hidden="true"
            className="h-4 w-4 motion-safe:animate-spin"
          />
        )}
        {collect.isPending
          ? "Đang ghi nhận…"
          : `Xác nhận đã thu · ${formatVnd(amount)}`}
      </button>
    </div>
  );
}
