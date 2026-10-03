import Link from "next/link";
import { FiArrowRight, FiCheckCircle, FiGift } from "react-icons/fi";
import type { VoucherWallet } from "@/lib/vouchers/voucher.types";
import {
  formatPromoVnd,
  promoExpiryLabel,
  promoScopeLabel,
} from "../promotions/promo-format";
import { walletDetailHref } from "./voucher-detail-href";

function heroDiscountLabel(wallet: VoucherWallet): string {
  if (wallet.discountType === "percent") return `-${wallet.discountValue}%`;
  if (wallet.discountType === "free_service") return "Miễn phí công";
  return `-${formatPromoVnd(wallet.discountValue)}`;
}

function grantedDayLabel(wallet: VoucherWallet): string | null {
  if (!wallet.grantedAt) return null;
  const at = new Date(wallet.grantedAt);
  if (Number.isNaN(at.getTime())) return null;
  return `Nhận ${at.toLocaleDateString("vi-VN")}`;
}

// Hero 2x2 tile: the customer's best usable voucher rendered as a ticket —
// big type on the left, a dashed stub on the right. Top-left on lg, first
// in DOM on mobile.
export function WalletHeroTicket({ wallet }: { wallet: VoucherWallet }) {
  const usable = wallet.status === "active";
  const grantedDay = grantedDayLabel(wallet);
  return (
    <article
      data-reveal
      aria-label={`Voucher ${wallet.campaignName}`}
      className="flex overflow-hidden rounded-2xl border border-zinc-200 bg-white sm:col-span-2 lg:row-span-2 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex min-w-0 flex-1 flex-col p-4 md:p-5">
        <p className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            <FiGift aria-hidden="true" className="h-5 w-5" />
          </span>
          <span className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            Voucher của bạn
          </span>
        </p>
        <p className="mt-4 text-5xl font-bold tracking-tight text-zinc-900 lg:text-6xl dark:text-zinc-50">
          {heroDiscountLabel(wallet)}
        </p>
        <p className="mt-2 truncate text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          {wallet.campaignName}
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {promoScopeLabel(wallet.scope)} ·{" "}
          {promoExpiryLabel({ endAt: wallet.expiresAt })}
        </p>
        <div className="mt-auto pt-4">
          <Link
            href={walletDetailHref(wallet.id)}
            scroll={false}
            prefetch
            aria-label={`Xem voucher ${wallet.campaignName} trong ví`}
            className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Xem voucher
            <FiArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <div className="flex w-20 shrink-0 flex-col items-center justify-center gap-2 border-l-2 border-dashed border-zinc-300 bg-zinc-100 px-2 py-4 text-center sm:w-24 dark:border-zinc-700 dark:bg-zinc-900">
        <FiCheckCircle
          aria-hidden="true"
          className="h-6 w-6 text-zinc-500 dark:text-zinc-400"
        />
        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
          {usable ? "Đã nhận" : "Đã qua"}
        </p>
        {grantedDay ? (
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {grantedDay}
          </p>
        ) : null}
      </div>
    </article>
  );
}
