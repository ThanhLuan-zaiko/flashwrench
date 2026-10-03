import Image from "next/image";
import Link from "next/link";
import { FiArrowRight, FiGift } from "react-icons/fi";
import type { VoucherWallet } from "@/lib/vouchers/voucher.types";
import { walletDetailHref } from "./voucher-detail-href";

function statusLabel(status: VoucherWallet["status"]): string {
  if (status === "used") return "Đã dùng";
  if (status === "expired") return "Hết hạn";
  if (status === "revoked") return "Đã thu hồi";
  return "Còn hiệu lực";
}

function discountLabel(wallet: VoucherWallet): string {
  if (wallet.discountType === "percent") return `Giảm ${wallet.discountValue}%`;
  if (wallet.discountType === "free_service") return "Miễn phí công";
  return `Giảm ${wallet.discountValue.toLocaleString("vi-VN")}đ`;
}

export function WalletCard({ wallet }: { wallet: VoucherWallet }) {
  const usable = wallet.status === "active";
  return (
    <article
      data-reveal
      className={`overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 ${usable ? "" : "opacity-70"}`}
    >
      <div className="relative h-32 w-full bg-zinc-100 dark:bg-zinc-900">
        {wallet.imageUrl ? (
          <Image
            src={wallet.imageUrl}
            alt={wallet.campaignName}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-zinc-400">
            <FiGift aria-hidden="true" className="h-8 w-8" />
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5 p-4">
        <p className="text-sm font-bold text-zinc-900 dark:text-white">
          {wallet.campaignName}
        </p>
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          {discountLabel(wallet)}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Mã gắn tài khoản • Không chia sẻ được
        </p>
        <p
          aria-live="polite"
          className="mt-1 inline-flex w-fit rounded-full border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-300"
        >
          {statusLabel(wallet.status)}
        </p>
        <Link
          href={walletDetailHref(wallet.id)}
          scroll={false}
          prefetch
          aria-label={`Xem chi tiết ${wallet.campaignName}`}
          className="mt-2 flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
        >
          Xem chi tiết
          <FiArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
