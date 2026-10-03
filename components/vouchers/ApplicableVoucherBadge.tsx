"use client";

import Link from "next/link";
import { FiGift, FiTag } from "react-icons/fi";
import { useMe } from "@/hooks/auth";
import { useMyWallets } from "@/hooks/useVouchers";
import {
  pickBestWallet,
  ticketDiscountText,
  type VoucherKind,
} from "@/lib/vouchers/voucher-pick";

type ApplicableVoucherBadgeProps = {
  kind: VoucherKind;
  subtotal: number;
};

// Compact ticket strip for catalog cards: one best saving plus the
// remaining count. Guests get a login hint, everyone else with no usable
// wallet renders nothing to keep the grid quiet.
export function ApplicableVoucherBadge({
  kind,
  subtotal,
}: ApplicableVoucherBadgeProps) {
  const me = useMe();
  const isAccount = me.isSuccess && me.data?.role === "customer";
  const wallets = useMyWallets(isAccount, { limit: 100 });

  if (me.isPending || (isAccount && wallets.isPending)) {
    return (
      <p
        aria-busy="true"
        className="min-h-[44px] motion-safe:animate-pulse rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <span className="sr-only">Đang kiểm tra ưu đãi</span>
      </p>
    );
  }

  if (me.isSuccess && me.data === null) {
    return (
      <Link
        href="/login"
        aria-label="Đăng nhập để xem ưu đãi áp được cho món này"
        className="flex min-h-[44px] items-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-600 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <FiGift aria-hidden="true" className="h-4 w-4 shrink-0" />
        <span>
          Đăng nhập để xem ưu đãi
          <span className="mt-0.5 block text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
            Voucher gắn thẳng vào tài khoản của bạn
          </span>
        </span>
      </Link>
    );
  }

  if (!isAccount) return null;
  if (wallets.isError) return null;
  const pick = pickBestWallet(wallets.data?.items ?? [], kind, subtotal);
  if (!pick) return null;

  return (
    <Link
      href="/vouchers"
      scroll={false}
      prefetch
      aria-label={`${pick.wallet.campaignName}: ${ticketDiscountText(pick.wallet, pick.discount)} cho món này`}
      className="flex min-h-[44px] items-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
    >
      <FiTag
        aria-hidden="true"
        className="h-4 w-4 shrink-0 text-zinc-700 dark:text-zinc-200"
      />
      <span className="min-w-0">
        <span className="block truncate text-xs font-semibold text-zinc-900 dark:text-zinc-50">
          {ticketDiscountText(pick.wallet, pick.discount)} ·{" "}
          {pick.wallet.campaignName}
        </span>
        <span className="block text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
          {pick.count > 1
            ? `Tự trừ ở bước thanh toán · Còn ${pick.count - 1} phiếu khác`
            : "Tự trừ ở bước thanh toán"}
        </span>
      </span>
    </Link>
  );
}
