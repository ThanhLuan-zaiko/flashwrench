"use client";

import { useMemo } from "react";
import { useMyWallets } from "@/hooks/useVouchers";
import type { VoucherWallet } from "@/lib/vouchers/voucher.types";
import { clampVoucherDiscount } from "@/lib/vouchers/voucher-discount";

type WalletPickerProps = {
  kind: "order" | "booking";
  subtotal: number;
  value: string | null;
  error?: string;
  disabled?: boolean;
  onChange: (walletId: string | null) => void;
};

function discountLabel(wallet: VoucherWallet, subtotal: number): string {
  const discount = clampVoucherDiscount({
    discountType: wallet.discountType,
    discountValue: wallet.discountValue,
    maxDiscount: wallet.maxDiscount,
    subtotal,
  });
  if (wallet.discountType === "percent") {
    return `Giảm ${wallet.discountValue}% (tối đa ${discount.toLocaleString("vi-VN")}đ)`;
  }
  if (wallet.discountType === "free_service") return "Miễn phí công sửa";
  return `Giảm ${discount.toLocaleString("vi-VN")}đ`;
}

export function WalletPicker({
  kind,
  subtotal,
  value,
  error,
  disabled,
  onChange,
}: WalletPickerProps) {
  const wallets = useMyWallets(true);
  const usable = useMemo(() => {
    const items = wallets.data ?? [];
    return items.filter(
      (wallet) =>
        wallet.status === "active" &&
        (wallet.scope === "all" || wallet.scope === kind) &&
        subtotal >= wallet.minOrder &&
        clampVoucherDiscount({
          discountType: wallet.discountType,
          discountValue: wallet.discountValue,
          maxDiscount: wallet.maxDiscount,
          subtotal,
        }) > 0,
    );
  }, [wallets.data, kind, subtotal]);

  if (wallets.isPending) {
    return (
      <p className="text-xs text-zinc-500 motion-safe:animate-pulse dark:text-zinc-400">
        Đang tải voucher…
      </p>
    );
  }
  if (wallets.isError || usable.length === 0) {
    return (
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Chưa có voucher nào dùng được cho đơn này.{" "}
        <a href="/vouchers" className="font-semibold underline">
          Xem ví voucher
        </a>
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="wallet-picker"
        className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
      >
        Voucher của tôi (không bắt buộc)
      </label>
      <select
        id="wallet-picker"
        value={value ?? ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value || null)}
        className="min-h-[44px] rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      >
        <option value="">Không dùng voucher</option>
        {usable.map((wallet) => (
          <option key={wallet.id} value={wallet.id}>
            {wallet.campaignName} — {discountLabel(wallet, subtotal)}
          </option>
        ))}
      </select>
      {error && (
        <p
          role="alert"
          className="text-xs font-medium text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}
