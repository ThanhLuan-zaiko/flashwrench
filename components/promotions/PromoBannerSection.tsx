"use client";

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
}: PromoBannerSectionProps) {
  useVoucherRealtime(undefined, false);
  const campaigns = usePublicCampaigns(true);

  if (campaigns.isPending) {
    return (
      <section aria-label="Đang tải ưu đãi" aria-busy="true">
        <div className="aspect-[4/3] motion-safe:animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 sm:aspect-[16/7] dark:border-zinc-800 dark:bg-zinc-900" />
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
    <section aria-label="Ưu đãi đang chạy" className="flex flex-col gap-3">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
          Khuyến mãi
        </p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {subtitle}
        </p>
      </header>
      <div data-reveal>
        <PromoCarousel campaigns={items} />
      </div>
    </section>
  );
}
