"use client";

import Link from "next/link";
import { useRef } from "react";
import { FiArrowRight } from "react-icons/fi";
import { CarouselBars } from "@/components/home/CarouselBars";
import {
  type PromoAudience,
  promoAppliesTo,
} from "@/components/promotions/promo-format";
import { useCarousel } from "@/hooks/useCarousel";
import { useChapterMotion } from "@/hooks/useChapterMotion";
import { useVoucherRealtime } from "@/hooks/useVoucherRealtime";
import { usePublicCampaigns } from "@/hooks/useVouchers";
import { MaskLines } from "../MaskLines";
import { HomePromoLead } from "./HomePromoLead";
import { HomePromoRow } from "./HomePromoRow";

const HOME_PROMO_LIMIT = 4;

type HomePromoListProps = {
  title?: string;
  // Narrows the chapter to campaigns for one page (order on /products).
  audience?: PromoAudience;
  // Campaign ids to leave out (for example the ones the viewer already owns).
  excludeIds?: ReadonlySet<string>;
  // Lists every live campaign as ruled rows instead of the lead carousel.
  // Used on the vouchers page, where the whole offer list must be visible.
  showAll?: boolean;
};

// Promotions chapter. On the home page the wide lead cycles through the first
// few live campaigns with a GSAP crossfade, and the ruled rows beside it list
// the same campaigns with the one on show marked. With `showAll` every live
// campaign is listed as a ruled row, two columns wide from md. Renders nothing
// while loading, on error or when no campaign is live.
export function HomePromoList({
  title = "Ưu đãi đang chạy",
  audience,
  excludeIds,
  showAll = false,
}: HomePromoListProps) {
  const rootRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  useVoucherRealtime(undefined, false);
  const campaigns = usePublicCampaigns(true);
  const items = (campaigns.data ?? []).filter(
    (campaign) =>
      (audience ? promoAppliesTo(campaign, audience) : true) &&
      !excludeIds?.has(campaign.id),
  );
  const shown = showAll ? items : items.slice(0, HOME_PROMO_LIMIT);
  const [current, setCurrent] = useCarousel(
    frameRef,
    showAll ? 0 : shown.length,
    true,
  );
  useChapterMotion(rootRef, shown.length > 0);

  if (campaigns.isError || shown.length === 0) return null;

  if (showAll) {
    return (
      <section
        ref={rootRef}
        aria-label={title}
        className="w-full px-4 pt-12 sm:px-6 md:pt-10 lg:px-10"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wide text-[#1E3A5F] uppercase dark:text-zinc-400">
              Khuyến mãi
            </p>
            <MaskLines
              lines={[title]}
              className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 md:text-4xl dark:text-zinc-50"
            />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {shown.length} ưu đãi đang chạy
          </p>
        </div>
        <ul className="mt-6 grid md:grid-cols-2 md:gap-x-12">
          {shown.map((campaign) => (
            <HomePromoRow
              key={campaign.id}
              campaign={campaign}
              active={false}
            />
          ))}
        </ul>
      </section>
    );
  }

  const rotating = shown.length > 1;

  return (
    <section
      ref={rootRef}
      aria-label="Ưu đãi đang chạy"
      className="w-full px-4 pt-12 sm:px-6 md:pt-10 lg:px-10"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wide text-[#1E3A5F] uppercase dark:text-zinc-400">
            Khuyến mãi
          </p>
          <MaskLines
            lines={[title]}
            className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 md:text-4xl dark:text-zinc-50"
          />
        </div>
        <Link
          href="/vouchers"
          prefetch
          className="flex min-h-11 w-fit shrink-0 items-center gap-1.5 text-sm font-bold text-[#1E3A5F] underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] dark:text-zinc-100 dark:focus-visible:ring-zinc-100"
        >
          Xem tất cả {items.length} ưu đãi
          <FiArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
      <div
        className={`mt-8 grid gap-x-12 gap-y-10 md:mt-10 md:items-start ${rotating ? "md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]" : ""}`}
      >
        <div className="flex flex-col gap-4">
          <div ref={frameRef} className="grid">
            {shown.map((campaign, position) => (
              <div
                key={campaign.id}
                data-slide
                inert={position !== current}
                className={`col-start-1 row-start-1 ${position === 0 ? "opacity-100" : "opacity-0"}`}
              >
                <HomePromoLead campaign={campaign} />
              </div>
            ))}
          </div>
          {rotating && (
            <CarouselBars
              keys={shown.map((campaign) => campaign.id)}
              current={current}
              itemLabel="Ưu đãi"
              onSelect={setCurrent}
            />
          )}
        </div>
        {rotating && (
          <ul>
            {shown.map((campaign, position) => (
              <HomePromoRow
                key={campaign.id}
                campaign={campaign}
                active={position === current}
              />
            ))}
            <li>
              <span
                data-rule
                aria-hidden="true"
                className="block h-px origin-left bg-zinc-200 dark:bg-zinc-800"
              />
            </li>
          </ul>
        )}
      </div>
    </section>
  );
}
