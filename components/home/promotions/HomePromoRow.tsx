import Link from "next/link";
import { FiGift } from "react-icons/fi";
import {
  promoTermsLabel,
  promoValueParts,
} from "@/components/promotions/promo-format";
import { campaignDetailHref } from "@/components/vouchers/voucher-detail-href";
import type { PublicVoucherCampaign } from "@/lib/vouchers/voucher.types";

type HomePromoRowProps = {
  campaign: PublicVoucherCampaign;
  active: boolean;
};

// One live campaign as a compact ruled row: a small cover, then the figure,
// name and terms in full, wrapping rather than cut off. The row for the
// campaign on show in the lead carries a navy rule.
export function HomePromoRow({ campaign, active }: HomePromoRowProps) {
  const figure = promoValueParts(campaign);

  return (
    <li>
      <span
        data-rule
        aria-hidden="true"
        className={`block h-px origin-left ${active ? "bg-[#1E3A5F] dark:bg-zinc-50" : "bg-zinc-200 dark:bg-zinc-800"}`}
      />
      <Link
        href={campaignDetailHref(campaign.slug)}
        scroll={false}
        prefetch
        data-chapter-row
        aria-current={active}
        aria-label={`Xem chi tiết ${campaign.name}`}
        className="group grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-x-4 py-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 md:grid-cols-[6.5rem_minmax(0,1fr)] md:py-5"
      >
        <span className="block h-16 overflow-hidden rounded-lg bg-zinc-100 md:h-20 dark:bg-zinc-900">
          {campaign.imageUrl ? (
            // biome-ignore lint/performance/noImgElement: campaign cover served immutable from media storage; next/image optimizer hop adds no value here.
            <img
              src={campaign.imageUrl}
              alt=""
              loading="lazy"
              data-chapter-photo
              className="h-full w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.04]"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-zinc-400 dark:text-zinc-600">
              <FiGift aria-hidden="true" className="h-6 w-6" />
            </span>
          )}
        </span>
        <span className="min-w-0">
          <span className="block text-lg leading-tight font-bold tracking-tight text-[#1E3A5F] md:text-xl dark:text-zinc-50">
            {figure.value}
            <span className="ml-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
              {figure.unit}
            </span>
          </span>
          <span className="mt-0.5 block text-sm font-bold text-balance text-zinc-900 md:text-base dark:text-zinc-50">
            {campaign.name}
          </span>
          <span className="mt-0.5 block text-xs text-balance text-zinc-600 md:text-sm dark:text-zinc-400">
            {promoTermsLabel(campaign)}
          </span>
        </span>
      </Link>
    </li>
  );
}
