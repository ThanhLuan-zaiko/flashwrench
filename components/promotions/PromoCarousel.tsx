"use client";

import { usePromoCarousel } from "@/hooks/usePromoCarousel";
import { usePromoSlideMotion } from "@/hooks/usePromoSlideMotion";
import type { PublicVoucherCampaign } from "@/lib/vouchers/voucher.types";
import { PromoAccordion } from "./PromoAccordion";
import { PromoExpandStrip } from "./PromoExpandStrip";

type PromoCarouselProps = {
  campaigns: PublicVoucherCampaign[];
};

// Promotion carousel: the open campaign spreads across a row of panels on
// desktop and unfolds inside a vertical accordion on phones. Auto-rotates,
// pauses on hover/focus and swipes on touch; GSAP slides the copy in on every
// change and runs once per change, never on first paint.
export function PromoCarousel({ campaigns }: PromoCarouselProps) {
  const count = campaigns.length;
  const carousel = usePromoCarousel(count);
  const rootRef = usePromoSlideMotion<HTMLDivElement>(
    carousel.index,
    carousel.direction,
  );
  if (!campaigns[carousel.index]) return null;

  const listProps = {
    campaigns,
    index: carousel.index,
    showControls: count > 1,
    announce: carousel.paused,
    onPick: (i: number) => carousel.go(i),
    onPrev: carousel.prev,
    onNext: carousel.next,
  };

  return (
    <div ref={rootRef}>
      <section
        aria-roledescription="carousel"
        aria-label="Ưu đãi đang chạy"
        {...carousel.pauseHandlers}
        {...carousel.swipeHandlers}
      >
        <PromoExpandStrip {...listProps} />
        <PromoAccordion {...listProps} />
      </section>
    </div>
  );
}
