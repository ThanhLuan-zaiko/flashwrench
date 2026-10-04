"use client";

import { useId, useMemo } from "react";
import { FormAlert } from "@/components/auth/FormAlert";
import { DropdownSelect } from "@/components/ui/DropdownSelect";
import { useMyWallets } from "@/hooks/useVouchers";
import type { VoucherWallet } from "@/lib/vouchers/voucher.types";
import { clampVoucherDiscount } from "@/lib/vouchers/voucher-discount";
import { VoucherTotals } from "./VoucherTotals";

type WalletPickerProps = {
  kind: "order" | "booking";
  subtotal: number;
  value: string | null;
  error?: string;
  disabled?: boolean;
  showTotals?: boolean;
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
  showTotals = false,
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
      { value: "", label: "Không dùng voucher", hint: "Thanh toán đủ tiền" },
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
  const selected = usable.find((wallet) => wallet.id === value);
  const discount = selected
    ? clampVoucherDiscount({
        discountType: selected.discountType,
        discountValue: selected.discountValue,
        maxDiscount: selected.maxDiscount,
        subtotal,
      })
    : 0;
  const message =
    error ??
    (value && !selected
      ? "Voucher đã chọn không còn phù hợp. Vui lòng chọn lại."
      : undefined);
  const totals = showTotals ? (
    <VoucherTotals subtotal={subtotal} discount={discount} />
  ) : null;

  if (wallets.isPending) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-zinc-500 motion-safe:animate-pulse dark:text-zinc-400">
          Đang tải voucher…
        </p>
        {totals}
      </div>
    );
  }
  if (wallets.isError || usable.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Chưa có voucher nào dùng được cho đơn này.{" "}
          <a
            href="/vouchers"
            className="inline-flex min-h-[44px] items-center rounded-lg font-semibold underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500"
          >
            Xem ví voucher
          </a>
        </p>
        {message && <FormAlert message={message} />}
        {totals}
      </div>
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
        error={Boolean(message)}
      />
      {message && <FormAlert message={message} />}
      {totals}
    </div>
  );
}
