import Image from "next/image";
import { FiGift } from "react-icons/fi";
import type { PublicVoucherCampaign } from "@/lib/vouchers/voucher.types";
import { promoShortLabel } from "./promo-format";

type PromoThumbStripProps = {
  campaigns: PublicVoucherCampaign[];
  index: number;
  onPick: (index: number) => void;
};

// Quick-jump strip under the spotlight: one compact chip per campaign,
// the active one outlined in navy. Scrolls sideways on phones and becomes
// a four-column grid from `md` up.
export function PromoThumbStrip({
  campaigns,
  index,
  onPick,
}: PromoThumbStripProps) {
  if (campaigns.length < 2) return null;
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      <ul
        aria-label="Chọn ưu đãi"
        className="flex snap-x snap-mandatory gap-2 md:grid md:grid-cols-4 md:gap-3"
      >
        {campaigns.map((campaign, i) => {
          const active = i === index;
          return (
            <li
              key={campaign.id}
              className="w-44 shrink-0 snap-start md:w-auto"
            >
              <button
                type="button"
                onClick={() => onPick(i)}
                aria-label={`Xem ưu đãi ${campaign.name}`}
                aria-current={active}
                className={`flex min-h-11 w-full items-center gap-2.5 rounded-2xl border bg-white p-2 text-left transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] motion-safe:active:scale-[0.99] md:gap-3 md:p-2.5 dark:bg-zinc-950 dark:focus-visible:ring-zinc-100 ${
                  active
                    ? "border-[#1E3A5F] ring-1 ring-[#1E3A5F] dark:border-zinc-100 dark:ring-zinc-100"
                    : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                }`}
              >
                <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-zinc-100 md:h-12 md:w-12 dark:bg-zinc-900">
                  {campaign.imageUrl ? (
                    <Image
                      src={campaign.imageUrl}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <FiGift
                      aria-hidden="true"
                      className="absolute inset-0 m-auto h-5 w-5 text-zinc-400"
                    />
                  )}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-[13px] font-extrabold text-[#1E3A5F] md:text-sm dark:text-zinc-100">
                    {promoShortLabel(campaign)}
                  </span>
                  <span className="truncate text-xs text-zinc-600 md:text-[13px] dark:text-zinc-400">
                    {campaign.name}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
