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

// 1x1 companion tile for the owner's other active vouchers — the hero
// ticket holds the best one, these keep the rest one tap away.
export function WalletMiniTile({ wallet }: { wallet: VoucherWallet }) {
  return (
    <Link
      href={walletDetailHref(wallet.id)}
      scroll={false}
      prefetch
      data-reveal
      aria-label={`Mở voucher ${wallet.campaignName}`}
      className="flex min-h-[44px] flex-col justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 transition-colors duration-200 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
    >
      <p className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        {miniDiscountLabel(wallet)}
      </p>
      <div className="flex items-end justify-between gap-2">
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
          {wallet.campaignName}
        </p>
        <FiArrowRight
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-zinc-400"
        />
      </div>
    </Link>
  );
}
