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

const SECTION_CLASSES =
  "flex flex-col gap-2 border-t border-zinc-200 pt-10 md:pt-12 dark:border-zinc-800";

// Secondary actions on the detail page are bold text links with an arrow.
const LINK_CLASSES =
  "flex min-h-11 w-fit items-center gap-1.5 text-sm font-bold text-[#111111] underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] motion-safe:active:scale-[0.99] dark:text-zinc-100 dark:focus-visible:ring-zinc-100";

// Voucher line for the detail page: best saving, terms and the wallet link.
// Guests get a login call to action instead of an empty block.
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
        className={SECTION_CLASSES}
      >
        <div className="h-16 rounded-lg bg-zinc-100 motion-safe:animate-pulse dark:bg-zinc-900" />
      </section>
    );
  }

  if (me.isSuccess && me.data === null) {
    return (
      <section aria-label="Ưu đãi cho món này" className={SECTION_CLASSES}>
        <p className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-zinc-50">
          <FiGift aria-hidden="true" className="h-4 w-4" />
          Món này có thể được giảm giá
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Đăng nhập để xem phiếu ưu đãi gắn với tài khoản của bạn. Voucher tự
          trừ ở bước thanh toán.
        </p>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
          <Link
            href="/login"
            aria-label="Đăng nhập để xem ưu đãi"
            className={LINK_CLASSES}
          >
            Đăng nhập để xem ưu đãi
            <FiArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
          <Link
            href="/vouchers"
            scroll={false}
            prefetch
            className={LINK_CLASSES}
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
      <section aria-label="Ưu đãi cho món này" className={SECTION_CLASSES}>
        <p className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-zinc-50">
          <FiTag aria-hidden="true" className="h-4 w-4" />
          Chưa có phiếu nào dùng được cho món này
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Đặt hàng, đặt lịch và gửi đánh giá để hệ thống tự phát voucher vào ví
          của bạn.
        </p>
        <Link
          href="/vouchers"
          scroll={false}
          prefetch
          className={`mt-2 ${LINK_CLASSES}`}
        >
          Xem cách nhận ưu đãi
          <FiArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </section>
    );
  }

  return (
    <section aria-label="Phiếu ưu đãi áp được" className={SECTION_CLASSES}>
      <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
        Phiếu gắn với tài khoản của bạn
      </p>
      <p className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        {ticketDiscountText(pick.wallet, pick.discount)}
      </p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {pick.wallet.campaignName}
        {pick.wallet.minOrder > 0 &&
          ` · Đơn từ ${new Intl.NumberFormat("vi-VN").format(pick.wallet.minOrder)}đ`}
        {pick.count > 1 && ` · Còn ${pick.count - 1} phiếu khác trong ví`}
      </p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Hệ thống tự áp phiếu tiết kiệm nhất khi bạn đặt lịch hoặc thanh toán.
      </p>
      <div className="mt-2">
        <Link href="/vouchers" scroll={false} prefetch className={LINK_CLASSES}>
          Xem ví voucher
          <FiArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
