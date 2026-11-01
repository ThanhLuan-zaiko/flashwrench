import Image from "next/image";
import Link from "next/link";
import { FiArrowRight, FiGift } from "react-icons/fi";
import type { VoucherWallet } from "@/lib/vouchers/voucher.types";
import { walletDetailHref } from "./voucher-detail-href";
import { walletStatusLabel } from "./wallet-status-label";

function discountLabel(wallet: VoucherWallet): string {
  if (wallet.discountType === "percent") return `Giảm ${wallet.discountValue}%`;
  if (wallet.discountType === "free_service") return "Miễn phí công";
  return `Giảm ${wallet.remainingValue.toLocaleString("vi-VN")}đ`;
}

// One row of the voucher archive: a small cover, the campaign and its
// discount, the status line and a text link to the voucher.
export function WalletCard({ wallet }: { wallet: VoucherWallet }) {
  const usable = wallet.spendable;
  return (
    <article className={`flex gap-4 py-4 ${usable ? "" : "opacity-70"}`}>
      <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-100 md:h-20 md:w-28 dark:bg-zinc-900">
        {wallet.imageUrl ? (
          <Image
            src={wallet.imageUrl}
            alt={wallet.campaignName}
            fill
            sizes="112px"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-zinc-400">
            <FiGift aria-hidden="true" className="h-6 w-6" />
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-sm font-bold text-zinc-900 dark:text-white">
          {wallet.campaignName}
        </p>
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          {discountLabel(wallet)}
        </p>
        <p
          aria-live="polite"
          className="text-xs text-zinc-500 dark:text-zinc-400"
        >
          {walletStatusLabel(wallet)} · Mã gắn tài khoản, không chia sẻ được
        </p>
        <Link
          href={walletDetailHref(wallet.id)}
          scroll={false}
          prefetch
          aria-label={`Xem chi tiết ${wallet.campaignName}`}
          className="mt-1 flex min-h-11 w-fit items-center gap-1.5 text-sm font-bold text-[#1E3A5F] underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] dark:text-zinc-100 dark:focus-visible:ring-zinc-100"
        >
          Xem chi tiết
          <FiArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
