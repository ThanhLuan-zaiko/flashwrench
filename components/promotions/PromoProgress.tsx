import type { PublicVoucherCampaign } from "@/lib/vouchers/voucher.types";

type PromoProgressProps = {
  campaigns: PublicVoucherCampaign[];
  index: number;
};

// Above this many campaigns, segments would be too thin to read, so only the
// counter remains.
const SEGMENT_LIMIT = 8;

// Story-style progress over the active cover: one segment per campaign, the
// viewed ones solid white and the active one filled by the slide motion hook.
// Long lists show the counter alone.
export function PromoProgress({ campaigns, index }: PromoProgressProps) {
  const showSegments = campaigns.length <= SEGMENT_LIMIT;
  return (
    <div className="flex items-center gap-3 rounded-full bg-[#0F1E33]/60 px-3 py-2">
      {showSegments ? (
        <div aria-hidden="true" className="flex flex-1 gap-1.5">
          {campaigns.map((campaign, i) => (
            <span
              key={campaign.id}
              className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/35"
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
      ) : null}
      <span className="text-xs font-bold text-white tabular-nums">
        {index + 1}/{campaigns.length}
      </span>
    </div>
  );
}
