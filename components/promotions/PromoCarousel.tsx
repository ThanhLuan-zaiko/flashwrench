"use client";

import { usePromoCarousel } from "@/hooks/usePromoCarousel";
import { usePromoSlideMotion } from "@/hooks/usePromoSlideMotion";
import type { PublicVoucherCampaign } from "@/lib/vouchers/voucher.types";
import { PromoSpotlightMedia } from "./PromoSpotlightMedia";
import { PromoSpotlightPanel } from "./PromoSpotlightPanel";
import { PromoThumbStrip } from "./PromoThumbStrip";

type PromoCarouselProps = {
  campaigns: PublicVoucherCampaign[];
};

// Spotlight carousel for public promotions: one campaign at a time in a
// navy copy panel beside its cover (stacked on phones), with a thumbnail
// strip below for quick jumps. Auto-rotates, pauses on hover/focus and
// swipes on touch; GSAP slides the copy in on every change.
export function PromoCarousel({ campaigns }: PromoCarouselProps) {
  const count = campaigns.length;
  const carousel = usePromoCarousel(count);
  const rootRef = usePromoSlideMotion<HTMLDivElement>(
    carousel.index,
    carousel.direction,
  );
  const active = campaigns[carousel.index];
  if (!active) return null;

  return (
    <div ref={rootRef} className="flex flex-col gap-3 md:gap-4">
      <section
        aria-roledescription="carousel"
        aria-label="Ưu đãi đang chạy"
        {...carousel.pauseHandlers}
        {...carousel.swipeHandlers}
        className="flex flex-col overflow-hidden rounded-3xl border border-zinc-200 md:grid md:grid-cols-2 dark:border-zinc-800"
      >
        <div className="md:order-2">
          <PromoSpotlightMedia campaigns={campaigns} index={carousel.index} />
        </div>
        <div className="md:order-1 md:flex md:flex-col">
          <PromoSpotlightPanel
            campaign={active}
            showControls={count > 1}
            announce={carousel.paused}
            onPrev={carousel.prev}
            onNext={carousel.next}
          />
        </div>
      </section>
      <PromoThumbStrip
        campaigns={campaigns}
        index={carousel.index}
        onPick={(i) => carousel.go(i)}
      />
    </div>
  );
}
