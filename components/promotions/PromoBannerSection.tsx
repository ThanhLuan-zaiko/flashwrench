"use client";

import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import { useVoucherRealtime } from "@/hooks/useVoucherRealtime";
import { usePublicCampaigns } from "@/hooks/useVouchers";
import { PromoCarousel } from "./PromoCarousel";
import { type PromoAudience, promoAppliesTo } from "./promo-format";

type PromoBannerSectionProps = {
  title?: string;
  subtitle?: string;
  audience?: PromoAudience;
  // Campaign ids the viewer already owns — hidden so the carousel only
  // sells promotions still up for grabs.
  excludeIds?: ReadonlySet<string>;
  // Off on /vouchers itself, where a link back to the same page is noise.
  showAllLink?: boolean;
};

// Public promotion banner: a large auto-rotating carousel guests see to
// create an account, customers see to know which campaign to ask staff
// about. Every live campaign renders — optionally narrowed to the page's
// audience (booking on /services, order on /products). Renders nothing
// when nothing matches so landing layouts keep their rhythm.
export function PromoBannerSection({
  title = "Ưu đãi đang chạy",
  subtitle = "Voucher gắn thẳng vào tài khoản, tạo tài khoản để được phát tự động khi đủ điều kiện.",
  audience,
  excludeIds,
  showAllLink = true,
}: PromoBannerSectionProps) {
  useVoucherRealtime(undefined, false);
  const campaigns = usePublicCampaigns(true);

  if (campaigns.isPending) {
    return (
      <section aria-label="Đang tải ưu đãi" aria-busy="true">
        <div className="h-[30rem] motion-safe:animate-pulse rounded-3xl border border-zinc-200 bg-zinc-100 md:h-[22rem] dark:border-zinc-800 dark:bg-zinc-900" />
      </section>
    );
  }

  if (campaigns.isError) return null;
  const items = (campaigns.data ?? []).filter(
    (campaign) =>
      (audience ? promoAppliesTo(campaign, audience) : true) &&
      !excludeIds?.has(campaign.id),
  );
  if (items.length === 0) return null;

  return (
    <section aria-label="Ưu đãi đang chạy" className="flex flex-col gap-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-wide text-[#1E3A5F] uppercase dark:text-zinc-400">
            Khuyến mãi
          </p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
            {title}
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {subtitle}
          </p>
        </div>
        {showAllLink && (
          <Link
            href="/vouchers"
            prefetch
            className="flex min-h-11 w-fit shrink-0 items-center gap-1.5 rounded-lg text-sm font-bold text-[#1E3A5F] underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] dark:text-zinc-100 dark:focus-visible:ring-zinc-100"
          >
            Xem tất cả {items.length} ưu đãi
            <FiArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        )}
      </header>
      <div data-reveal>
        <PromoCarousel campaigns={items} />
      </div>
    </section>
  );
}
