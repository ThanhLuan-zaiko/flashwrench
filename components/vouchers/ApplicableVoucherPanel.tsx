"use client";

import Link from "next/link";
import { FiArrowRight, FiGift, FiTag } from "react-icons/fi";
import { useMe } from "@/hooks/auth";
import { useMyWallets } from "@/hooks/useVouchers";
import {
  pickBestWallet,
  ticketDiscountText,
  type VoucherKind,
} from "@/lib/vouchers/voucher-pick";

type ApplicableVoucherPanelProps = {
  kind: VoucherKind;
  subtotal: number;
};

const PANEL_CLASSES =
  "rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950";

// Full ticket panel for detail screens: best saving, terms and the wallet
// link. Guests get a login call to action instead of an empty box.
export function ApplicableVoucherPanel({
  kind,
  subtotal,
}: ApplicableVoucherPanelProps) {
  const me = useMe();
  const isAccount = me.isSuccess && me.data?.role === "customer";
  const wallets = useMyWallets(isAccount, { limit: 100 });

  if (me.isPending || (isAccount && wallets.isPending)) {
    return (
      <section
        aria-label="Đang kiểm tra ưu đãi"
        aria-busy="true"
        className={PANEL_CLASSES}
      >
        <div className="h-16 motion-safe:animate-pulse rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900" />
      </section>
    );
  }

  if (me.isSuccess && me.data === null) {
    return (
      <section aria-label="Ưu đãi cho món này" className={PANEL_CLASSES}>
        <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          <FiGift aria-hidden="true" className="h-4 w-4" />
          Món này có thể được giảm giá
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Đăng nhập để xem phiếu ưu đãi gắn với tài khoản của bạn. Voucher tự
          trừ ở bước thanh toán.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/login"
            aria-label="Đăng nhập để xem ưu đãi"
            className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Đăng nhập để xem ưu đãi
            <FiArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
          <Link
            href="/vouchers"
            scroll={false}
            prefetch
            className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Xem ưu đãi đang chạy
          </Link>
        </div>
      </section>
    );
  }

  if (!isAccount || wallets.isError) return null;
  const pick = pickBestWallet(wallets.data?.items ?? [], kind, subtotal);

  if (!pick) {
    return (
      <section aria-label="Ưu đãi cho món này" className={PANEL_CLASSES}>
        <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          <FiTag aria-hidden="true" className="h-4 w-4" />
          Chưa có phiếu nào dùng được cho món này
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Đặt hàng, đặt lịch và gửi đánh giá để hệ thống tự phát voucher vào ví
          của bạn.
        </p>
        <Link
          href="/vouchers"
          scroll={false}
          prefetch
          className="mt-3 flex min-h-[44px] w-fit items-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Xem cách nhận ưu đãi
          <FiArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </section>
    );
  }

  return (
    <section aria-label="Phiếu ưu đãi áp được" className={PANEL_CLASSES}>
      <p className="text-[11px] font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
        Phiếu gắn với tài khoản của bạn
      </p>
      <p className="mt-1 flex items-center gap-2 text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        <FiTag aria-hidden="true" className="h-4 w-4 shrink-0" />
        {ticketDiscountText(pick.wallet, pick.discount)}
      </p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        {pick.wallet.campaignName}
        {pick.wallet.minOrder > 0 &&
          ` · Đơn từ ${new Intl.NumberFormat("vi-VN").format(pick.wallet.minOrder)}đ`}
        {pick.count > 1 && ` · Còn ${pick.count - 1} phiếu khác trong ví`}
      </p>
      <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
        Chọn phiếu ở bước thanh toán, hệ thống tự trừ vào tổng tiền.
      </p>
      <Link
        href="/vouchers"
        scroll={false}
        prefetch
        className="mt-3 flex min-h-[44px] w-fit items-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        Xem ví voucher
        <FiArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </section>
  );
}
