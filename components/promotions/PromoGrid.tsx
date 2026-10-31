"use client";

import { usePromoCarousel } from "@/hooks/usePromoCarousel";
import { usePromoSlideMotion } from "@/hooks/usePromoSlideMotion";
import type { PublicVoucherCampaign } from "@/lib/vouchers/voucher.types";
import { PromoGridCompact, PromoGridFeatured } from "./PromoGridCard";
import {
  PROMO_GRID_LIMIT,
  promoCellClass,
  promoGridLayout,
} from "./promo-grid-layout";

type PromoGridProps = {
  campaigns: PublicVoucherCampaign[];
};

// Public promotions as one grid. The featured slot (2×2 from lg, the top card
// on phones) rotates through the visible campaigns on the shared carousel
// timer; the other slots show the rest in list order. The timer pauses on
// hover and focus, swipes move the carousel on touch, and the progress bar and
// the arrows in the featured card step it by hand. Lists longer than
// PROMO_GRID_LIMIT rotate through the first campaigns; the section header
// links to the full list.
export function PromoGrid({ campaigns }: PromoGridProps) {
  const visible = campaigns.slice(0, PROMO_GRID_LIMIT);
  const count = visible.length;
  const carousel = usePromoCarousel(count);
  const rootRef = usePromoSlideMotion<HTMLDivElement>(
    carousel.index,
    carousel.direction,
  );
  const active = visible[carousel.index];
  if (!active) return null;

  const ordered = [active, ...visible.filter((_, i) => i !== carousel.index)];
  const layout = promoGridLayout(count);
  const showControls = count > 1;

  return (
    <div ref={rootRef}>
      <section
        aria-roledescription="carousel"
        aria-label="Các ưu đãi đang chạy"
        {...carousel.pauseHandlers}
        {...carousel.swipeHandlers}
      >
        <ul
          aria-label="Danh sách ưu đãi"
          className="grid grid-cols-1 gap-4 lg:grid-cols-3"
        >
          {ordered.map((campaign, slot) => {
            const span = layout[slot];
            return (
              <li
                key={campaign.id}
                className={span ? promoCellClass(span) : undefined}
              >
                {slot === 0 ? (
                  <PromoGridFeatured
                    campaign={campaign}
                    campaigns={visible}
                    index={carousel.index}
                    showControls={showControls}
                    announce={carousel.paused}
                    onPrev={carousel.prev}
                    onNext={carousel.next}
                  />
                ) : (
                  <PromoGridCompact campaign={campaign} />
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
