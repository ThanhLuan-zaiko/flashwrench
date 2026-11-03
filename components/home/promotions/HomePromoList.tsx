"use client";

import Link from "next/link";
import { useRef } from "react";
import { FiArrowRight } from "react-icons/fi";
import { PromoCampaignCard } from "@/components/promotions/PromoCampaignCard";
import {
  type PromoAudience,
  promoAppliesTo,
} from "@/components/promotions/promo-format";
import { useChapterMotion } from "@/hooks/useChapterMotion";
import { useVoucherRealtime } from "@/hooks/useVoucherRealtime";
import { usePublicCampaigns } from "@/hooks/useVouchers";
import { MaskLines } from "../MaskLines";

const HOME_PROMO_LIMIT = 4;

type HomePromoListProps = {
  title?: string;
  // Narrows the chapter to campaigns for one page (order on /products).
  audience?: PromoAudience;
  // Campaign ids to leave out (for example the ones the viewer already owns).
  excludeIds?: ReadonlySet<string>;
  // Lists every live campaign instead of the first few. Used on the vouchers
  // page, where the whole offer list must be visible.
  showAll?: boolean;
};

// Promotions chapter as a card grid. The home page shows the first few live
// campaigns with a link to the full list; `showAll` lists every live campaign.
// Renders nothing while loading, on error or when no campaign is live.
export function HomePromoList({
  title = "Ưu đãi đang chạy",
  audience,
  excludeIds,
  showAll = false,
}: HomePromoListProps) {
  const rootRef = useRef<HTMLElement>(null);
  useVoucherRealtime(undefined, false);
  const campaigns = usePublicCampaigns(true);
  const items = (campaigns.data ?? []).filter(
    (campaign) =>
      (audience ? promoAppliesTo(campaign, audience) : true) &&
      !excludeIds?.has(campaign.id),
  );
  const shown = showAll ? items : items.slice(0, HOME_PROMO_LIMIT);
  useChapterMotion(rootRef, shown.length > 0);

  if (campaigns.isError || shown.length === 0) return null;

  return (
    <section
      ref={rootRef}
      aria-label={title}
      className="mx-auto max-w-7xl w-full px-4 pt-12 sm:px-6 md:pt-10 lg:px-8"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wide text-[#111111] uppercase dark:text-zinc-400">
            Khuyến mãi
          </p>
          <MaskLines
            lines={[title]}
            className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl dark:text-zinc-50"
          />
        </div>
        {showAll ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {shown.length} ưu đãi đang chạy
          </p>
        ) : (
          <Link
            href="/vouchers"
            prefetch
            className="flex min-h-11 w-fit shrink-0 items-center gap-1.5 text-sm font-bold text-[#1D4ED8] underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] dark:text-blue-300 dark:focus-visible:ring-zinc-100"
          >
            Xem tất cả {items.length} ưu đãi
            <FiArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        )}
      </div>
      <ul
        className={`mt-8 grid grid-cols-1 gap-4 md:mt-10 md:gap-6 sm:grid-cols-2 ${showAll ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}
      >
        {shown.map((campaign) => (
          <li key={campaign.id}>
            <PromoCampaignCard campaign={campaign} />
          </li>
        ))}
      </ul>
    </section>
  );
}
