import Link from "next/link";
import { FiArrowRight, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import type { PublicVoucherCampaign } from "@/lib/vouchers/voucher.types";
import { campaignDetailHref } from "../vouchers/voucher-detail-href";
import {
  promoScopeLabel,
  promoTermsLabel,
  promoValueParts,
} from "./promo-format";

type PromoActiveCopyProps = {
  campaign: PublicVoucherCampaign;
  showControls: boolean;
  announce: boolean;
  onPrev: () => void;
  onNext: () => void;
};

const NAV_BUTTON =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/30 text-white transition-colors duration-200 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white motion-safe:active:scale-95";

// Copy of the open campaign: scope, name, the discount figure, terms and the
// actions. Lines carry data-promo-anim so a slide change can stagger them in.
// The controls stay put so they never move under the viewer's finger.
export function PromoActiveCopy({
  campaign,
  showControls,
  announce,
  onPrev,
  onNext,
}: PromoActiveCopyProps) {
  const figure = promoValueParts(campaign);
  return (
    <div className="flex flex-col gap-4">
      <div
        aria-live={announce ? "polite" : "off"}
        className="flex flex-col gap-2"
      >
        <p
          data-promo-anim
          className="text-[11px] font-bold tracking-[0.12em] text-zinc-300 uppercase"
        >
          {promoScopeLabel(campaign.scope)}
        </p>
        <h3
          data-promo-anim
          className="text-xl font-extrabold tracking-tight lg:text-[1.75rem]"
        >
          {campaign.name}
        </h3>
        <p data-promo-anim className="flex flex-wrap items-baseline gap-x-3">
          <span className="text-[3.25rem] leading-none font-extrabold tracking-[-0.03em] lg:text-[4rem]">
            {figure.value}
          </span>
          <span className="text-xs font-bold tracking-[0.08em] text-zinc-300 uppercase">
            {figure.unit}
          </span>
        </p>
        <p data-promo-anim className="text-sm text-zinc-300">
          {promoTermsLabel(campaign)}
        </p>
        {campaign.description ? (
          <p data-promo-anim className="text-sm leading-relaxed text-zinc-200">
            {campaign.description}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Link
          href={campaignDetailHref(campaign.slug)}
          scroll={false}
          prefetch
          aria-label={`Xem chi tiết ${campaign.name}`}
          className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-white px-5 text-sm font-bold text-[#1E3A5F] transition-colors duration-200 hover:bg-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E3A5F] motion-safe:active:scale-[0.99] lg:flex-none"
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
