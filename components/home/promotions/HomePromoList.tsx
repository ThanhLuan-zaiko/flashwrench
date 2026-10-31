"use client";

import Link from "next/link";
import { useRef } from "react";
import { FiArrowRight } from "react-icons/fi";
import {
  promoTermsLabel,
  promoValueParts,
} from "@/components/promotions/promo-format";
import { campaignDetailHref } from "@/components/vouchers/voucher-detail-href";
import { useChapterMotion } from "@/hooks/useChapterMotion";
import { useVoucherRealtime } from "@/hooks/useVoucherRealtime";
import { usePublicCampaigns } from "@/hooks/useVouchers";
import { MaskLines } from "../MaskLines";

const HOME_PROMO_LIMIT = 4;

// Promotions chapter: live campaigns as ruled rows (cover photo, figure,
// name, terms) instead of a banner. Renders nothing while loading, on error
// or when no campaign is live, so the page keeps its rhythm.
export function HomePromoList() {
  const rootRef = useRef<HTMLElement>(null);
  useVoucherRealtime(undefined, false);
  const campaigns = usePublicCampaigns(true);
  const items = campaigns.data ?? [];
  const shown = items.slice(0, HOME_PROMO_LIMIT);
  useChapterMotion(rootRef, shown.length > 0);

  if (campaigns.isError || shown.length === 0) return null;

  return (
    <section
      ref={rootRef}
      aria-label="Ưu đãi đang chạy"
      className="w-full px-4 pt-12 sm:px-6 md:pt-16 lg:px-10"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wide text-[#1E3A5F] uppercase dark:text-zinc-400">
            Khuyến mãi
          </p>
          <MaskLines
            lines={["Ưu đãi đang chạy"]}
            className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 md:text-5xl dark:text-zinc-50"
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
      <ul className="mt-6 md:mt-8">
        {shown.map((campaign) => {
          const figure = promoValueParts(campaign);
          return (
            <li key={campaign.id}>
              <span
                data-rule
                aria-hidden="true"
                className="block h-px origin-left bg-zinc-200 dark:bg-zinc-800"
              />
              <Link
                href={campaignDetailHref(campaign.slug)}
                scroll={false}
                prefetch
                data-chapter-row
                aria-label={`Xem chi tiết ${campaign.name}`}
                className="group grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-x-4 gap-y-1 py-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 md:grid-cols-[11rem_12rem_minmax(0,1fr)_minmax(0,16rem)] md:gap-x-8 md:py-6"
              >
                <span className="row-span-3 block h-20 overflow-hidden rounded-lg bg-zinc-100 md:row-span-1 md:h-24 dark:bg-zinc-900">
                  {campaign.imageUrl ? (
                    // biome-ignore lint/performance/noImgElement: campaign cover served immutable from media storage; next/image optimizer hop adds no value here.
                    <img
                      src={campaign.imageUrl}
                      alt=""
                      loading="lazy"
                      data-chapter-photo
                      className="h-full w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.04]"
                    />
                  ) : null}
                </span>
                <span className="text-2xl leading-tight font-bold tracking-tight text-[#1E3A5F] md:text-4xl dark:text-zinc-50">
                  {figure.value}
                  <span className="mt-1 block text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                    {figure.unit}
                  </span>
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-bold tracking-tight text-zinc-900 transition-transform duration-300 motion-safe:group-hover:translate-x-1 md:text-lg dark:text-zinc-50">
                    {campaign.name}
                  </span>
                  {campaign.description ? (
                    <span className="mt-1 line-clamp-2 block text-sm text-zinc-600 dark:text-zinc-400">
                      {campaign.description}
                    </span>
                  ) : null}
                </span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {promoTermsLabel(campaign)}
                </span>
              </Link>
            </li>
          );
        })}
        <li>
          <span
            data-rule
            aria-hidden="true"
            className="block h-px origin-left bg-zinc-200 dark:bg-zinc-800"
          />
        </li>
      </ul>
    </section>
  );
}
