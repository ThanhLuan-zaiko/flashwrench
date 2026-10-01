"use client";

import Image from "next/image";
import { FiGift } from "react-icons/fi";
import type { VoucherCampaign } from "@/lib/vouchers/voucher.types";

type Props = {
  campaign: VoucherCampaign;
  onToggle: (campaign: VoucherCampaign) => void;
  toggling: boolean;
};

export function CampaignCard({ campaign, onToggle, toggling }: Props) {
  return (
    <article
      data-reveal
      className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="relative h-28 w-full bg-zinc-100 dark:bg-zinc-900">
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
            <FiGift aria-hidden="true" className="h-7 w-7" />
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5 p-4">
        <p className="truncate text-sm font-bold text-zinc-900 dark:text-white">
          {campaign.name}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {campaign.code} • Đã phát {campaign.grantedCount}
          {campaign.totalLimit > 0 ? `/${campaign.totalLimit}` : ""}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {campaign.allowDispatcherGrant
            ? "Điều phối được phát"
            : "Chỉ admin được phát"}
        </p>
        <button
          type="button"
          disabled={toggling}
          onClick={() => onToggle(campaign)}
          aria-label={campaign.isActive ? "Tắt chiến dịch" : "Bật chiến dịch"}
          className="mt-1 flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-200 px-3 text-sm font-medium text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 disabled:opacity-50 motion-safe:active:scale-[0.99] dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          {campaign.isActive
            ? "Đang bật — bấm để tắt"
            : "Đang tắt — bấm để bật"}
        </button>
      </div>
    </article>
  );
}
