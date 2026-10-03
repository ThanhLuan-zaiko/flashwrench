"use client";

import Image from "next/image";
import Link from "next/link";
import { FiArrowRight, FiGift, FiInfo } from "react-icons/fi";
import { useProgressFill } from "@/hooks/useProgressFill";
import type { PublicVoucherCampaign } from "@/lib/vouchers/voucher.types";
import { campaignDetailHref } from "../vouchers/voucher-detail-href";
import {
  type PromoProgress,
  promoConditionLabel,
  promoDiscountLabel,
  promoEarnHint,
  promoExpiryLabel,
  promoScopeLabel,
} from "./promo-format";

function slotsLabel(campaign: PublicVoucherCampaign): string | null {
  if (campaign.totalLimit <= 0) return null;
  const remaining = Math.max(0, campaign.totalLimit - campaign.grantedCount);
  return `Còn ${remaining}/${campaign.totalLimit} suất`;
}

// Shelf card for one running promotion: cover, discount, terms and a
// link to the detail page. `ghost` renders the dashed "not in your
// wallet yet" treatment used on the /vouchers shelf; `progress` draws
// the milestone bar for logged-in customers.
export function PromoCampaignCard({
  campaign,
  ghost = false,
  progress = null,
}: {
  campaign: PublicVoucherCampaign;
  ghost?: boolean;
  progress?: PromoProgress | null;
}) {
  const slots = slotsLabel(campaign);
  const fillRef = useProgressFill(progress?.ratio ?? 0);
  return (
    <article
      data-reveal
      className={`overflow-hidden rounded-2xl border bg-white dark:bg-zinc-950 ${
        ghost
          ? "border-dashed border-zinc-300 dark:border-zinc-700"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <div
        className={`relative h-32 w-full bg-zinc-100 dark:bg-zinc-900 ${
          ghost ? "opacity-80" : ""
        }`}
      >
        {campaign.imageUrl ? (
          <Image
            src={campaign.imageUrl}
            alt={campaign.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-zinc-400">
            <FiGift aria-hidden="true" className="h-8 w-8" />
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5 p-4">
        <p className="text-sm font-bold text-zinc-900 dark:text-white">
          {campaign.name}
        </p>
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          {promoDiscountLabel(campaign)}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {promoConditionLabel(campaign)} · {promoExpiryLabel(campaign)}
        </p>
        <p className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <FiInfo aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          Cách nhận: {promoEarnHint(campaign.earn)}
        </p>
        {progress ? (
          <div className="mt-1">
            <div
              role="progressbar"
              aria-valuenow={Math.round(progress.ratio * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Tiến độ nhận ${campaign.name}`}
              className="h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
            >
              <div
                ref={fillRef}
                className="h-full w-full origin-left rounded-full bg-zinc-700 dark:bg-zinc-300"
              />
            </div>
            <p className="mt-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
              {progress.label}
            </p>
          </div>
        ) : null}
        <p className="mt-1 flex flex-wrap gap-1.5">
          <span className="rounded-full border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
            {promoScopeLabel(campaign.scope)}
          </span>
          {slots ? (
            <span className="rounded-full border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
              {slots}
            </span>
          ) : null}
        </p>
        <Link
          href={campaignDetailHref(campaign.slug)}
          scroll={false}
          prefetch
          aria-label={`Xem chi tiết ${campaign.name}`}
          className="mt-2 flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
        >
          Xem chi tiết
          <FiArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
