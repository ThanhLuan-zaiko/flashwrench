import Link from "next/link";
import {
  promoTermsLabel,
  promoValueParts,
} from "@/components/promotions/promo-format";
import { campaignDetailHref } from "@/components/vouchers/voucher-detail-href";
import type { PublicVoucherCampaign } from "@/lib/vouchers/voucher.types";

type HomePromoLeadProps = {
  campaign: PublicVoucherCampaign;
};

// The first live campaign as the chapter's lead: a wide cover photo with the
// figure, name and terms under it, so the most useful offer reads first.
export function HomePromoLead({ campaign }: HomePromoLeadProps) {
  const figure = promoValueParts(campaign);

  return (
    <Link
      href={campaignDetailHref(campaign.slug)}
      scroll={false}
      prefetch
      data-chapter-row
      aria-label={`Xem chi tiết ${campaign.name}`}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
    >
      <span className="block aspect-[4/3] overflow-hidden rounded-lg bg-zinc-100 md:aspect-[16/10] dark:bg-zinc-900">
        {campaign.imageUrl ? (
          // biome-ignore lint/performance/noImgElement: campaign cover served immutable from media storage; next/image optimizer hop adds no value here.
          <img
            src={campaign.imageUrl}
            alt=""
            loading="lazy"
            data-chapter-photo
            className="h-full w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.02]"
          />
        ) : null}
      </span>
      <span className="mt-5 block text-2xl leading-none font-bold tracking-tight text-[#1E3A5F] md:text-3xl dark:text-zinc-50">
        {figure.value}
        <span className="ml-3 align-middle text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
          {figure.unit}
        </span>
      </span>
      <span className="mt-3 block text-lg font-bold tracking-tight text-zinc-900 md:text-xl dark:text-zinc-50">
        {campaign.name}
      </span>
      {campaign.description ? (
        <span className="mt-2 line-clamp-2 block max-w-xl text-sm text-zinc-600 md:text-base dark:text-zinc-400">
          {campaign.description}
        </span>
      ) : null}
      <span className="mt-3 block text-sm text-zinc-600 dark:text-zinc-400">
        {promoTermsLabel(campaign)}
      </span>
    </Link>
  );
}
