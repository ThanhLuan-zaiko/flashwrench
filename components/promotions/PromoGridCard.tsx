import Image from "next/image";
import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import type { PublicVoucherCampaign } from "@/lib/vouchers/voucher.types";
import { campaignDetailHref } from "../vouchers/voucher-detail-href";
import { PromoActiveCopy } from "./PromoActiveCopy";
import { PromoProgress } from "./PromoProgress";
import { promoTermsLabel, promoValueParts } from "./promo-format";

type PromoGridFeaturedProps = {
  campaign: PublicVoucherCampaign;
  campaigns: PublicVoucherCampaign[];
  index: number;
  showControls: boolean;
  announce: boolean;
  onPrev: () => void;
  onNext: () => void;
};

// The featured slot of the grid, navy: photo beside the copy from lg, photo
// above it on phones. The carousel swaps the campaign shown here.
export function PromoGridFeatured({
  campaign,
  campaigns,
  index,
  showControls,
  announce,
  onPrev,
  onNext,
}: PromoGridFeaturedProps) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-[#1E3A5F] text-white lg:grid lg:grid-cols-2">
      <div className="relative h-52 shrink-0 overflow-hidden lg:h-auto">
        <div data-promo-cover="active" className="absolute inset-0">
          <CoverImage
            campaign={campaign}
            sizes="(min-width: 1024px) 560px, 100vw"
          />
        </div>
        {campaigns.length > 1 ? (
          <div className="absolute inset-x-4 top-4">
            <PromoProgress campaigns={campaigns} index={index} />
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col justify-center p-5 sm:p-6 lg:p-8">
        <PromoActiveCopy
          campaign={campaign}
          showControls={showControls}
          announce={announce}
          onPrev={onPrev}
          onNext={onNext}
        />
      </div>
    </article>
  );
}

// A campaign in the grid's smaller slots: cover, name, discount, terms and the
// whole description, with a link to the detail page.
export function PromoGridCompact({
  campaign,
}: {
  campaign: PublicVoucherCampaign;
}) {
  const figure = promoValueParts(campaign);
  return (
    <article className="grid h-full grid-cols-[7.5rem_minmax(0,1fr)] overflow-hidden rounded-2xl border border-zinc-200 bg-white lg:grid-cols-[40%_minmax(0,1fr)] dark:border-zinc-800 dark:bg-zinc-950">
      <div className="relative overflow-hidden">
        <CoverImage
          campaign={campaign}
          sizes="(min-width: 1024px) 180px, 120px"
        />
      </div>
      <div className="flex min-w-0 flex-col justify-between gap-2 p-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-[15px] leading-snug font-extrabold tracking-tight text-zinc-900 lg:text-base dark:text-zinc-50">
            {campaign.name}
          </h3>
          <p className="text-xl leading-tight font-extrabold text-[#1E3A5F] lg:text-2xl dark:text-zinc-100">
            {figure.value}
          </p>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            {promoTermsLabel(campaign)}
          </p>
          {campaign.description ? (
            <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
              {campaign.description}
            </p>
          ) : null}
        </div>
        <Link
          href={campaignDetailHref(campaign.slug)}
          scroll={false}
          prefetch
          aria-label={`Xem chi tiết ${campaign.name}`}
          className="inline-flex min-h-11 items-center gap-1 self-start rounded-lg text-sm font-bold text-[#1E3A5F] underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] dark:text-zinc-100 dark:focus-visible:ring-zinc-100"
        >
          Xem chi tiết
          <FiArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}

function CoverImage({
  campaign,
  sizes,
}: {
  campaign: PublicVoucherCampaign;
  sizes: string;
}) {
  return (
    <span className="absolute inset-0 block bg-zinc-200 dark:bg-zinc-800">
      {campaign.imageUrl ? (
        <Image
          src={campaign.imageUrl}
          alt=""
          fill
          sizes={sizes}
          className="object-cover"
        />
      ) : null}
    </span>
  );
}
