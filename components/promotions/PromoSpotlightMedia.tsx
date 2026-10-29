import Image from "next/image";
import { FiGift } from "react-icons/fi";
import type { PublicVoucherCampaign } from "@/lib/vouchers/voucher.types";

type PromoSpotlightMediaProps = {
  campaigns: PublicVoucherCampaign[];
  index: number;
};

// Cover side of the spotlight: every cover is stacked and cross-faded by
// Tailwind, the active one carries data-promo-cover="active" for the GSAP
// settle-in. A story-style segment bar plus an "N/M" counter shows where
// the viewer is in the rotation.
export function PromoSpotlightMedia({
  campaigns,
  index,
}: PromoSpotlightMediaProps) {
  const count = campaigns.length;
  return (
    <div className="relative h-52 overflow-hidden bg-zinc-100 sm:h-64 md:h-full md:min-h-[22rem] dark:bg-zinc-900">
      {campaigns.map((campaign, i) => {
        const active = i === index;
        return (
          <div
            key={campaign.id}
            aria-hidden="true"
            data-promo-cover={active ? "active" : "idle"}
            className={`absolute inset-0 motion-safe:transition-opacity motion-safe:duration-300 ${
              active ? "opacity-100" : "opacity-0"
            }`}
          >
            {campaign.imageUrl ? (
              <Image
                src={campaign.imageUrl}
                alt=""
                fill
                priority={i === 0}
                sizes="(min-width: 768px) 576px, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-zinc-400 dark:text-zinc-600">
                <FiGift aria-hidden="true" className="h-16 w-16" />
              </div>
            )}
          </div>
        );
      })}
      {count > 1 && (
        <div className="absolute inset-x-3 top-3 flex items-center gap-2.5 rounded-full bg-[#0F1E33]/60 px-3 py-2 sm:inset-x-4 sm:top-4 sm:px-3.5 sm:py-2.5">
          <div aria-hidden="true" className="flex flex-1 gap-1 sm:gap-1.5">
            {campaigns.map((campaign, i) => (
              <span
                key={campaign.id}
                className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/35 sm:h-1"
              >
                {i <= index && (
                  <span
                    data-promo-segment={i === index ? "active" : "done"}
                    className="block h-full w-full origin-left rounded-full bg-white"
                  />
                )}
              </span>
            ))}
          </div>
          <span className="text-xs font-bold text-white tabular-nums sm:text-[13px]">
            {index + 1}/{count}
          </span>
        </div>
      )}
    </div>
  );
}
