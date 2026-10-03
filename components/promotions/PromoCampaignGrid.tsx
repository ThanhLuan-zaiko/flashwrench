"use client";

import { useVoucherRealtime } from "@/hooks/useVoucherRealtime";
import { usePublicCampaigns } from "@/hooks/useVouchers";
import type { MyVoucherStats } from "@/services/vouchers.api";
import { PromoCampaignCard } from "./PromoCampaignCard";
import {
  type PromoAudience,
  promoAppliesTo,
  promoProgress,
} from "./promo-format";

type PromoCampaignGridProps = {
  audience?: PromoAudience;
  title?: string;
  anchorId?: string;
  // Campaign ids the viewer already owns — hidden so the shelf only
  // lists promotions still up for grabs.
  excludeIds?: ReadonlySet<string>;
  // Dashed "not in your wallet" treatment for every card.
  ghost?: boolean;
  // Logged-in customer's rollup — feeds the milestone progress bars.
  stats?: MyVoucherStats | null;
};

// Shelf grid listing promotions as individual cards — the carousel
// rotates through them, this grid keeps them visible side by side.
// Shares the public feed query with the banner above it; renders nothing
// when no campaign matches so the shelf stays quiet.
export function PromoCampaignGrid({
  audience,
  title = "Tất cả ưu đãi đang chạy",
  anchorId,
  excludeIds,
  ghost = false,
  stats = null,
}: PromoCampaignGridProps) {
  useVoucherRealtime(undefined, false);
  const campaigns = usePublicCampaigns(true);
  const items = (campaigns.data ?? []).filter(
    (campaign) =>
      (audience ? promoAppliesTo(campaign, audience) : true) &&
      !excludeIds?.has(campaign.id),
  );

  if (campaigns.isSuccess && items.length === 0) return null;

  return (
    <section id={anchorId} aria-label={title} className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        {title}
      </h2>
      {campaigns.isPending ? (
        <ul
          aria-busy="true"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3"
        >
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              className="h-64 motion-safe:animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
            />
          ))}
        </ul>
      ) : campaigns.isError ? (
        <p className="rounded-2xl border border-zinc-200 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
          Không tải được danh sách ưu đãi. Vui lòng thử lại sau.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
          {items.map((campaign) => (
            <li key={campaign.id}>
              <PromoCampaignCard
                campaign={campaign}
                ghost={ghost}
                progress={promoProgress(campaign.earn, stats)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
