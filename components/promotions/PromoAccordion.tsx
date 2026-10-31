import Image from "next/image";
import type { PublicVoucherCampaign } from "@/lib/vouchers/voucher.types";
import { PromoActiveCopy } from "./PromoActiveCopy";
import { PromoProgress } from "./PromoProgress";
import type { PromoListProps } from "./promo-expand.types";
import { promoValueParts } from "./promo-format";
import { PROMO_VISIBLE_LIMIT, promoWindowStart } from "./promo-window";

// Phone view: a vertical accordion. The open campaign unfolds into a card with
// its cover and copy, the others fold into one-line rows that open on tap.
// Like the desktop strip, it shows at most PROMO_VISIBLE_LIMIT campaigns.
export function PromoAccordion({
  campaigns,
  index,
  showControls,
  announce,
  onPick,
  onPrev,
  onNext,
}: PromoListProps) {
  const start = promoWindowStart(campaigns.length, index);
  const entries = campaigns
    .slice(start, start + PROMO_VISIBLE_LIMIT)
    .map((campaign, k) => ({ campaign, i: start + k }));
  return (
    <ol aria-label="Ưu đãi đang chạy" className="flex flex-col gap-2 lg:hidden">
      {entries.map(({ campaign, i }) =>
        i === index ? (
          <li key={campaign.id}>
            <div
              aria-current="true"
              className="overflow-hidden rounded-2xl bg-[#1E3A5F] text-white"
            >
              <div className="relative h-40 overflow-hidden">
                <div data-promo-cover="active" className="absolute inset-0">
                  {campaign.imageUrl ? (
                    <Image
                      src={campaign.imageUrl}
                      alt=""
                      fill
                      sizes="(min-width: 640px) 560px, 100vw"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                {campaigns.length > 1 ? (
                  <div className="absolute inset-x-3 top-3">
                    <PromoProgress campaigns={campaigns} index={index} />
                  </div>
                ) : null}
              </div>
              <div className="p-5">
                <PromoActiveCopy
                  campaign={campaign}
                  showControls={showControls}
                  announce={announce}
                  onPrev={onPrev}
                  onNext={onNext}
                />
              </div>
            </div>
          </li>
        ) : (
          <li key={campaign.id}>
            <ClosedRow campaign={campaign} onOpen={() => onPick(i)} />
          </li>
        ),
      )}
    </ol>
  );
}

function ClosedRow({
  campaign,
  onOpen,
}: {
  campaign: PublicVoucherCampaign;
  onOpen: () => void;
}) {
  const figure = promoValueParts(campaign);
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Xem ưu đãi ${campaign.name}`}
      className="flex h-[4.5rem] w-full items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-3 text-left transition-colors duration-200 hover:border-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] motion-safe:active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600 dark:focus-visible:ring-zinc-100"
    >
      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-zinc-200 dark:bg-zinc-800">
        {campaign.imageUrl ? (
          <Image
            src={campaign.imageUrl}
            alt=""
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : null}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">
        {campaign.name}
      </span>
      <span className="shrink-0 text-sm font-extrabold text-[#1E3A5F] dark:text-zinc-100">
        {figure.value}
      </span>
    </button>
  );
}
