"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { FiCheckCircle } from "react-icons/fi";
import { useClaimVoucherCode } from "@/hooks/useVoucherCode";
import type { VoucherWallet } from "@/lib/vouchers/voucher.types";
import type { VoucherKind } from "@/lib/vouchers/voucher-pick";
import { VoucherCodeApiError } from "@/services/voucher-code.api";

type VoucherCodeFieldProps = {
  kind: VoucherKind; // "booking" | "order"
  subtotal: number;
  value: string; // controlled text (booking keeps it in its draft)
  onValueChange: (value: string) => void;
  disabled?: boolean;
  loginHref?: string; // set => guest mode: login link instead of the apply button
  onApplied: (wallet: VoucherWallet) => void;
};

const ACTION_CLASS =
  "flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-60 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200";

// Typed redeem-code input shared by /booking and /checkout. Guests see a
// login link instead of the apply button — the code only works for
// accounts, since the claimed wallet binds to one.
export function VoucherCodeField({
  kind,
  subtotal,
  value,
  onValueChange,
  disabled = false,
  loginHref,
  onApplied,
}: VoucherCodeFieldProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const claim = useClaimVoucherCode();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const guest = loginHref !== undefined;
  const applying = claim.isPending;

  function apply() {
    if (guest || applying || disabled) return;
    const code = value.trim();
    if (!code) return;
    claim.mutate(
      { code, kind, subtotal },
      {
        onSuccess: (data) => {
          setError(null);
          setNotice(
            data.reused
              ? `Đã chọn ${data.wallet.campaignName} có sẵn trong ví.`
              : `Đã thêm ${data.wallet.campaignName} vào ví và áp dụng cho ${
                  kind === "booking" ? "lịch hẹn" : "đơn hàng"
                } này.`,
          );
          onApplied(data.wallet);
          onValueChange("");
        },
        onError: (err) => {
          setNotice(null);
          setError(
            err instanceof VoucherCodeApiError
              ? err.message
              : "Không áp được mã. Vui lòng thử lại.",
          );
        },
      },
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
      >
        Mã voucher
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          value={value}
          onChange={(e) => {
            onValueChange(e.target.value.toUpperCase());
            setError(null);
            setNotice(null);
          }}
          onKeyDown={(e) => {
            // The field lives inside the booking/checkout <form>: Enter
            // must never submit it.
            if (e.key !== "Enter") return;
            e.preventDefault();
            apply();
          }}
          placeholder="Nhập mã, VD: GIAM50K"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          maxLength={24}
          enterKeyHint="done"
          disabled={disabled}
          readOnly={applying}
          aria-busy={applying || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`h-11 min-w-0 flex-1 rounded-xl border bg-white px-3 font-mono text-sm uppercase text-zinc-900 placeholder:normal-case placeholder:text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 ${
            error
              ? "border-red-500 dark:border-red-400"
              : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600"
          }`}
        />
        {guest ? (
          <Link href={loginHref} className={ACTION_CLASS}>
            Đăng nhập để áp dụng
          </Link>
        ) : (
          <button
            type="button"
            onClick={apply}
            disabled={disabled || applying || value.trim() === ""}
            className={ACTION_CLASS}
          >
            {applying ? "Đang áp dụng…" : "Áp dụng"}
          </button>
        )}
      </div>
      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-xs font-medium text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          aria-live="polite"
          className="flex items-center gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-300"
        >
          <FiCheckCircle aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          {notice}
        </p>
      )}
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
        {guest
          ? "Voucher gắn với tài khoản. Đăng nhập xong bạn quay lại đúng trang này, thông tin đã nhập vẫn được giữ."
          : "Mã hợp lệ được thêm vào ví và trừ ngay vào tạm tính."}
      </p>
    </div>
  );
}
