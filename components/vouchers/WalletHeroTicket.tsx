import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
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
  return `-${formatPromoVnd(wallet.remainingValue)}`;
}

function grantedDayLabel(wallet: VoucherWallet): string | null {
  if (!wallet.grantedAt) return null;
  const at = new Date(wallet.grantedAt);
  if (Number.isNaN(at.getTime())) return null;
  return `Nhận ${at.toLocaleDateString("vi-VN")}`;
}

const TEXT_LINK =
  "flex min-h-11 w-fit items-center gap-1.5 text-sm font-bold text-[#111111] underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] motion-safe:active:scale-[0.99] dark:text-zinc-100 dark:focus-visible:ring-zinc-100";

// The customer's best usable voucher, as a text block: the discount figure,
// the campaign, then scope, expiry and grant date on one line. No box.
export function WalletHeroTicket({ wallet }: { wallet: VoucherWallet }) {
  const usable = wallet.status === "active";
  const grantedDay = grantedDayLabel(wallet);
  const meta = [
    promoScopeLabel(wallet.scope),
    promoExpiryLabel({ endAt: wallet.expiresAt }),
    usable ? "Đã nhận" : "Đã qua",
    grantedDay,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article
      data-chapter-row
      aria-label={`Voucher ${wallet.campaignName}`}
      className="flex min-w-0 flex-col gap-2"
    >
      <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
        Voucher của bạn
      </p>
      <p className="text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl dark:text-zinc-50">
        {heroDiscountLabel(wallet)}
      </p>
      <p className="text-base font-bold text-zinc-900 dark:text-zinc-50">
        {wallet.campaignName}
      </p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{meta}</p>
      <Link
        href={walletDetailHref(wallet.id)}
        scroll={false}
        prefetch
        aria-label={`Xem voucher ${wallet.campaignName} trong ví`}
        className={`mt-2 ${TEXT_LINK}`}
      >
        Xem voucher
        <FiArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </article>
  );
}
