"use client";

import { WalletPicker } from "../vouchers/WalletPicker";

type CheckoutExtrasProps = {
  fieldId: string;
  guest: boolean;
  subtotal: number;
  walletId: string | null;
  walletError?: string;
  note: string;
  disabled: boolean;
  onWallet: (walletId: string | null) => void;
  onNote: (note: string) => void;
};

// Wallet picker plus the optional note: account customers spend their
// vouchers here, guests see the signup incentive instead.
export function CheckoutExtras({
  fieldId,
  guest,
  subtotal,
  walletId,
  walletError,
  note,
  disabled,
  onWallet,
  onNote,
}: CheckoutExtrasProps) {
  return (
    <div>
      {!guest && (
        <WalletPicker
          kind="order"
          subtotal={subtotal}
          value={walletId}
          error={walletError}
          disabled={disabled}
          onChange={onWallet}
        />
      )}
      {guest && (
        <p className="rounded-xl border border-zinc-200 p-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Tạo tài khoản để nhận voucher sửa xe gắn riêng cho bạn — khách vãng
          lai thanh toán nguyên giá.
        </p>
      )}
      <label
        htmlFor={`${fieldId}-note`}
        className="mb-1.5 mt-3 block text-sm font-medium text-zinc-800 dark:text-zinc-200"
      >
        Ghi chú (không bắt buộc)
      </label>
      <textarea
        id={`${fieldId}-note`}
        value={note}
        onChange={(event) => onNote(event.target.value)}
        placeholder="Ví dụ: giao giờ hành chính, gọi trước khi đến"
        rows={2}
        disabled={disabled}
        className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors duration-200 hover:border-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:hover:border-zinc-600 dark:focus-visible:ring-offset-zinc-950"
      />
    </div>
  );
}
