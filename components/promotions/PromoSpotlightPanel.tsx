import Link from "next/link";
import { FiArrowRight, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import type { PublicVoucherCampaign } from "@/lib/vouchers/voucher.types";
import { campaignDetailHref } from "../vouchers/voucher-detail-href";
import {
  promoScopeLabel,
  promoTermsLabel,
  promoValueParts,
} from "./promo-format";

type PromoSpotlightPanelProps = {
  campaign: PublicVoucherCampaign;
  showControls: boolean;
  announce: boolean;
  onPrev: () => void;
  onNext: () => void;
};

const NAV_BUTTON =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/30 text-white transition-colors duration-200 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white motion-safe:active:scale-95 md:h-12 md:w-12";

// Navy copy side of the spotlight: scope, name, the big discount figure,
// terms and the actions. Each line carries data-promo-anim so a slide
// change can stagger it in; the controls stay put so they never move
// under the viewer's finger.
export function PromoSpotlightPanel({
  campaign,
  showControls,
  announce,
  onPrev,
  onNext,
}: PromoSpotlightPanelProps) {
  const figure = promoValueParts(campaign);
  return (
    <div className="flex flex-col justify-between gap-5 bg-[#1E3A5F] p-5 text-white sm:p-7 md:flex-1 md:p-9 lg:p-10">
      <div
        aria-live={announce ? "polite" : "off"}
        className="flex flex-col gap-2 md:gap-2.5"
      >
        <p
          data-promo-anim
          className="text-[11px] font-semibold tracking-[0.1em] text-zinc-300 uppercase md:text-xs"
        >
          {promoScopeLabel(campaign.scope)}
        </p>
        <h3
          data-promo-anim
          className="text-lg font-bold tracking-tight md:text-2xl"
        >
          {campaign.name}
        </h3>
        <p data-promo-anim className="flex flex-wrap items-baseline gap-x-2.5">
          <span className="text-[2.75rem] leading-none font-extrabold tracking-[-0.03em] md:text-6xl">
            {figure.value}
          </span>
          <span className="text-xs font-bold tracking-[0.08em] text-zinc-300 uppercase md:text-[13px]">
            {figure.unit}
          </span>
        </p>
        <p data-promo-anim className="text-[13px] text-zinc-300 md:text-[15px]">
          {promoTermsLabel(campaign)}
        </p>
        {campaign.description ? (
          <p
            data-promo-anim
            className="hidden max-w-md text-sm text-zinc-300 line-clamp-2 md:block"
          >
            {campaign.description}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-2 md:gap-2.5">
        <Link
          href={campaignDetailHref(campaign.slug)}
          scroll={false}
          prefetch
          aria-label={`Xem chi tiết ${campaign.name}`}
          className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-white px-5 text-sm font-bold text-[#1E3A5F] transition-colors duration-200 hover:bg-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E3A5F] motion-safe:active:scale-[0.99] md:min-h-12 md:flex-none md:text-[15px]"
        >
          Xem chi tiết
          <FiArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
        {showControls && (
          <>
            <button
              type="button"
              onClick={onPrev}
              aria-label="Ưu đãi trước"
              className={NAV_BUTTON}
            >
              <FiChevronLeft aria-hidden="true" className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onNext}
              aria-label="Ưu đãi sau"
              className={NAV_BUTTON}
            >
              <FiChevronRight aria-hidden="true" className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
