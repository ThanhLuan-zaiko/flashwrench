"use client";

import { useId, useState } from "react";
import { FiLoader, FiX } from "react-icons/fi";
import { ConfirmCodeField } from "@/app/mechanic/components/ConfirmCodeField";
import {
  COLLECT_METHOD_LABELS,
  COLLECT_METHODS,
  isValidConfirmCode,
  needsConfirmCode,
  parseCollectAmount,
} from "@/app/mechanic/components/collect-payment";
import { DIALOG_OVERLAY_CLASSES } from "@/components/ui/dialog-overlay";
import type { MechanicIncomeEntry } from "@/lib/mechanic/mechanic.types";
import type { BookingPaymentMethod } from "@/lib/payments/booking-payment.types";
import { formatVnd } from "../mechanic-format";

type Props = {
  entry: MechanicIncomeEntry | null;
  pending: boolean;
  issuePending: boolean;
  codeIssued: boolean;
  onIssueCode(): void;
  onClose(): void;
  onConfirm(input: {
    method: BookingPaymentMethod;
    amount: number;
    paymentId: string;
    confirmCode?: string;
  }): void;
};

// Confirms money collection for a finished job: the mechanic picks how the
// customer paid and how much arrived (empty amount settles the whole
// balance — partial installments are allowed), then reports upstream.
// One paymentId per open dialog keeps retries idempotent.
export function CollectPaymentDialog({
  entry,
  pending,
  issuePending,
  codeIssued,
  onIssueCode,
  onClose,
  onConfirm,
}: Props) {
  const uid = useId();
  const [method, setMethod] = useState<BookingPaymentMethod>("cod");
  const [amountText, setAmountText] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [paymentId, setPaymentId] = useState("");

  if (!entry) return null;
  const outstanding = entry.outstanding;
  const parsed = parseCollectAmount(amountText, outstanding);
  const invalidAmount = amountText.trim() !== "" && parsed === null;
  const needsCode = needsConfirmCode(method);
  const codeMissing = needsCode && !isValidConfirmCode(confirmCode);

  const close = () => {
    setMethod("cod");
    setAmountText("");
    setConfirmCode("");
    setPaymentId("");
    onClose();
  };
  const confirm = () => {
    const amount = parseCollectAmount(amountText, outstanding);
    if (amount === null || codeMissing) return;
    // crypto.randomUUID scopes one idempotency key per attempt; a retry
    // after a failed submit replays the same receipt instead of doubling.
    const id = paymentId || crypto.randomUUID();
    setPaymentId(id);
    onConfirm({
      method,
      amount,
      paymentId: id,
      confirmCode: needsCode ? confirmCode.trim() : undefined,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Xác nhận thu tiền"
      className={DIALOG_OVERLAY_CLASSES}
    >
      <button
        type="button"
        aria-label="Đóng hộp thoại"
        onClick={close}
        className="fixed inset-0 bg-zinc-950/50"
      />
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              Xác nhận thu tiền
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {entry.customerName || "Khách hàng"} · {entry.vehiclePlate}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Đóng hộp thoại"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <FiX aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 rounded-xl bg-zinc-100 px-3 py-2.5 text-xs dark:bg-zinc-900">
          <dt className="text-zinc-500 dark:text-zinc-400">Tổng đơn</dt>
          <dd className="text-right font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">
            {formatVnd(entry.total)}
          </dd>
          {entry.received > 0 && (
            <>
              <dt className="text-zinc-500 dark:text-zinc-400">Đã thu</dt>
              <dd className="text-right font-medium tabular-nums text-zinc-800 dark:text-zinc-200">
                {formatVnd(entry.received)}
              </dd>
            </>
          )}
          <dt className="text-zinc-500 dark:text-zinc-400">Còn phải thu</dt>
          <dd className="text-right font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {formatVnd(outstanding)}
          </dd>
        </dl>

        <label
          htmlFor={`${uid}-amount`}
          className="mt-3 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
        >
          Số tiền thu lần này — để trống thu đủ {formatVnd(outstanding)}
        </label>
        <input
          id={`${uid}-amount`}
          type="text"
          inputMode="numeric"
          value={amountText}
          disabled={pending}
          onChange={(event) => setAmountText(event.target.value)}
          placeholder={formatVnd(outstanding)}
          className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm tabular-nums text-zinc-900 outline-none transition-colors focus:border-zinc-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-400"
        />
        {invalidAmount && (
          <p
            role="alert"
            className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400"
          >
            Nhập số tiền hợp lệ, không vượt quá {formatVnd(outstanding)}.
          </p>
        )}
        {!invalidAmount && parsed !== null && parsed < outstanding && (
          <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            Thu một phần — còn lại {formatVnd(outstanding - parsed)} sau lần
            này.
          </p>
        )}

        <fieldset className="mt-3">
          <legend className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Phương thức thanh toán
          </legend>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {COLLECT_METHODS.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={method === option}
                disabled={pending}
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
        </fieldset>

        {needsCode && (
          <ConfirmCodeField
            id={`${uid}-code`}
            value={confirmCode}
            disabled={pending}
            issuePending={issuePending}
            issued={codeIssued}
            onChange={setConfirmCode}
            onIssue={onIssueCode}
          />
        )}
        {needsCode && confirmCode.trim() !== "" && codeMissing && (
          <p
            role="alert"
            className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400"
          >
            Mã xác nhận gồm đúng 6 chữ số.
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={close}
            className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={pending || invalidAmount || codeMissing}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {pending && (
              <FiLoader
                aria-hidden="true"
                className="h-4 w-4 motion-safe:animate-spin"
              />
            )}
            {pending
              ? "Đang ghi nhận…"
              : `Xác nhận · ${formatVnd(parsed ?? outstanding)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
