"use client";

import Link from "next/link";
import { FiArrowRight, FiGift } from "react-icons/fi";
import { useMe } from "@/hooks/auth";
import { useVoucherRealtime } from "@/hooks/useVoucherRealtime";
import { usePublicCampaigns } from "@/hooks/useVouchers";
import { campaignDetailHref } from "../vouchers/voucher-detail-href";
import { promoDiscountLabel } from "./promo-format";

// Compact guest nudge for booking and checkout: shows the top running
// promotion and routes guests to register, accounts to their wallet.
export function PromoTeaser() {
  useVoucherRealtime(undefined, false);
  const me = useMe();
  const campaigns = usePublicCampaigns(true);

  const guest = me.isSuccess && me.data === null;
  const items = campaigns.data ?? [];
  if (campaigns.isPending || campaigns.isError || items.length === 0) {
    return null;
  }
  const top = items[0];
  const href = guest ? "/register" : "/vouchers";
  const cta = guest ? "Tạo tài khoản để nhận" : "Xem ví của tôi";

  return (
    <section
      aria-label="Ưu đãi dành cho bạn"
      data-reveal
      className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          <FiGift aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            <Link
              href={campaignDetailHref(top.slug)}
              scroll={false}
              prefetch
              className="rounded-sm underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
            >
              {top.name} · {promoDiscountLabel(top)}
            </Link>
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Voucher gắn tài khoản, không dùng được cho khách vãng lai.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          href={campaignDetailHref(top.slug)}
          scroll={false}
          prefetch
          className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
        >
          Xem chi tiết
          <FiArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
        {me.isPending ? (
          <span
            aria-hidden="true"
            className="min-h-[44px] w-full motion-safe:animate-pulse rounded-xl bg-zinc-100 sm:w-44 dark:bg-zinc-800"
          />
        ) : (
          <Link
            href={href}
            scroll={false}
            prefetch
            className="flex min-h-[44px] items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {cta}
          </Link>
        )}
      </div>
    </section>
  );
}
