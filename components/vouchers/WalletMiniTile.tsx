import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import type { VoucherWallet } from "@/lib/vouchers/voucher.types";
import { formatPromoVnd } from "../promotions/promo-format";
import { walletDetailHref } from "./voucher-detail-href";

function miniDiscountLabel(wallet: VoucherWallet): string {
  if (wallet.discountType === "percent") return `-${wallet.discountValue}%`;
  if (wallet.discountType === "free_service") return "Miễn phí công";
  return `-${formatPromoVnd(wallet.discountValue)}`;
}

// A row in the owner's list of other active vouchers: the discount and the
// campaign name, with an arrow. The best voucher leads above the list.
export function WalletMiniTile({ wallet }: { wallet: VoucherWallet }) {
  return (
    <Link
      href={walletDetailHref(wallet.id)}
      scroll={false}
      prefetch
      aria-label={`Mở voucher ${wallet.campaignName}`}
      className="group flex min-h-11 items-center justify-between gap-4 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] dark:focus-visible:ring-zinc-100"
    >
      <span className="min-w-0">
        <span className="block text-sm font-bold text-zinc-900 dark:text-zinc-50">
          {miniDiscountLabel(wallet)}
        </span>
        <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
          {wallet.campaignName}
        </span>
      </span>
      <FiArrowRight
        aria-hidden="true"
        className="h-4 w-4 shrink-0 text-[#1E3A5F] motion-safe:transition-transform motion-safe:duration-200 group-hover:translate-x-0.5 dark:text-zinc-100"
      />
    </Link>
  );
}
