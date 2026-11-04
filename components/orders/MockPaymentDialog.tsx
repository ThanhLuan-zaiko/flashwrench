"use client";

import { useEffect, useRef, useState } from "react";
import { FaQrcode } from "react-icons/fa";
import { FiLoader, FiX } from "react-icons/fi";
import { formatVnd } from "@/app/admin/components/services/catalog-format";
import { usePayOrderOnline } from "@/hooks/orders";
import { useDialogFocus } from "@/hooks/useDialogFocus";
import { useSessionExpired } from "@/hooks/useSessionExpired";
import { AuthApiError } from "@/services/auth.api";

type MockPaymentDialogProps = {
  orderId: string;
  total: number;
  onClose: () => void;
  onPaid: (providerRef: string | null) => void;
  onError: (message: string) => void;
};

const MOCK_PROCESSING_MS = 800;

// Simulated payment gateway: renders fake transfer details plus a fake QR
// block; confirming "Đã thanh toán" waits a beat to mimic processing, then
// hits the pay endpoint which stamps a MOCK-* provider ref on the order.
export function MockPaymentDialog({
  orderId,
  total,
  onClose,
  onPaid,
  onError,
}: MockPaymentDialogProps) {
  const payOrder = usePayOrderOnline();
  const sessionExpired = useSessionExpired();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const busy = processing || payOrder.isPending;

  const confirm = () => {
    setError("");
    setProcessing(true);
    timer.current = setTimeout(() => {
      payOrder.mutate(orderId, {
        onSuccess: (data) => {
          setProcessing(false);
          onPaid(data.payment.providerRef);
        },
        onError: (err) => {
          setProcessing(false);
          if (sessionExpired(err, `/orders/${orderId}`)) return;
          if (err instanceof AuthApiError) {
            setError(
              err.errors.form ??
                "Thanh toán giả lập thất bại. Vui lòng thử lại.",
            );
          } else {
            onError(err.message || "Thanh toán giả lập thất bại.");
            onClose();
          }
        },
      });
    }, MOCK_PROCESSING_MS);
  };

  const dialogRef = useDialogFocus<HTMLDivElement>(onClose);

  return (
    <div
      role="dialog"
      ref={dialogRef}
      tabIndex={-1}
      aria-modal="true"
      aria-label="Thanh toán online giả lập"
      className="fixed inset-0 z-50 flex h-dvh items-end justify-center p-0 sm:items-center sm:p-4"
    >
      <button
        type="button"
        aria-label="Đóng thanh toán"
        onClick={onClose}
        disabled={busy}
        className="fixed inset-0 bg-[#111111]/50"
      />
      <div className="relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-zinc-200 bg-white p-5 sm:rounded-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              Thanh toán online
            </h2>
            <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
              Cổng thanh toán giả lập — không phát sinh giao dịch thật.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Đóng thanh toán"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-zinc-800 transition-colors duration-200 hover:bg-zinc-100 disabled:opacity-60 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <FiX aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex justify-center">
          <div className="flex h-36 w-36 items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-950">
            <FaQrcode
              aria-hidden="true"
              className="h-20 w-20 text-zinc-600 dark:text-zinc-400"
            />
          </div>
        </div>

        <dl className="mt-4 space-y-2 rounded-xl border border-zinc-200 bg-white p-3.5 text-xs dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex justify-between gap-3">
            <dt className="text-zinc-600 dark:text-zinc-400">Đơn hàng</dt>
            <dd className="font-semibold text-zinc-800 dark:text-zinc-200">
              #{orderId.slice(0, 8)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-zinc-600 dark:text-zinc-400">
              Nội dung chuyển khoản
            </dt>
            <dd className="font-semibold text-zinc-800 dark:text-zinc-200">
              FW {orderId.slice(0, 8).toUpperCase()}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-zinc-600 dark:text-zinc-400">
              Số tiền thanh toán
            </dt>
            <dd className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              {formatVnd(total)}
            </dd>
          </div>
        </dl>

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            {error}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={confirm}
            disabled={busy}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:pointer-events-none disabled:opacity-60 motion-safe:active:scale-[0.99] bg-[#1D4ED8] text-white hover:bg-[#1E40AF] dark:bg-[#60A5FA] dark:text-[#111111] dark:hover:bg-[#93C5FD]"
          >
            {busy && (
              <FiLoader
                aria-hidden="true"
                className="h-4 w-4 motion-safe:animate-spin"
              />
            )}
            {busy ? "Đang xử lý…" : "Xác nhận đã thanh toán"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex min-h-[44px] items-center rounded-xl border border-zinc-600 px-4 py-2 text-sm font-semibold text-[#111111] transition-colors duration-200 hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-400 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Để sau
          </button>
        </div>
      </div>
    </div>
  );
}
