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

// One voucher as a card: the campaign cover on top, then the discount, the
// status line and a link to the voucher. Spent or expired vouchers are dimmed.
export function WalletCard({ wallet }: { wallet: VoucherWallet }) {
  const usable = wallet.spendable;
  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 ${usable ? "" : "opacity-70"}`}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
        {wallet.imageUrl ? (
          <Image
            src={wallet.imageUrl}
            alt={wallet.campaignName}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-zinc-600 dark:text-zinc-400">
            <FiGift aria-hidden="true" className="h-8 w-8" />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4 md:p-5">
        <p className="line-clamp-2 text-sm font-bold text-zinc-900 dark:text-white">
          {wallet.campaignName}
        </p>
        <p className="text-lg font-extrabold tracking-tight text-[#111111] tabular-nums dark:text-zinc-50">
          {discountLabel(wallet)}
        </p>
        <p
          aria-live="polite"
          className="text-xs text-zinc-600 dark:text-zinc-400"
        >
          {walletStatusLabel(wallet)}
        </p>
        <p className="mt-auto pt-3 text-xs text-zinc-600 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-800">
          Mã gắn tài khoản, không chia sẻ được
        </p>
        <Link
          href={walletDetailHref(wallet.id)}
          prefetch
          aria-label={`Xem chi tiết ${wallet.campaignName}`}
          className="flex min-h-11 w-fit items-center gap-1.5 text-sm font-bold text-[#1D4ED8] underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] dark:text-blue-300 dark:focus-visible:ring-zinc-100"
        >
          Xem chi tiết
          <FiArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
