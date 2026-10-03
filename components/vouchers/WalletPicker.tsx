"use client";

import { useId, useMemo } from "react";
import { DropdownSelect } from "@/components/ui/DropdownSelect";
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
  const labelId = useId();
  // The picker needs every usable wallet, not just the newest page —
  // ask for the bounded max so none is hidden behind pagination.
  const wallets = useMyWallets(true, { limit: 100 });
  const usable = useMemo(() => {
    const items = wallets.data?.items ?? [];
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

  const options = useMemo(
    () => [
      {
        value: "",
        label: "Không dùng voucher",
        hint: "Thanh toán đủ tiền",
      },
      ...usable.map((wallet) => ({
        value: wallet.id,
        label: `${wallet.campaignName} — ${discountLabel(wallet, subtotal)}`,
        hint:
          wallet.minOrder > 0
            ? `Đơn từ ${wallet.minOrder.toLocaleString("vi-VN")}đ`
            : "Không yêu cầu giá trị tối thiểu",
      })),
    ],
    [usable, subtotal],
  );

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
      <span
        id={labelId}
        className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
      >
        Voucher của tôi (không bắt buộc)
      </span>
      <DropdownSelect
        id="wallet-picker"
        labelId={labelId}
        value={value ?? ""}
        onChange={(next) => onChange(next || null)}
        options={options}
        placeholder="Chọn voucher…"
        disabled={disabled}
        error={Boolean(error)}
      />
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
