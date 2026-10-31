import Image from "next/image";
import type { PublicVoucherCampaign } from "@/lib/vouchers/voucher.types";
import { PromoActiveCopy } from "./PromoActiveCopy";
import { PromoProgress } from "./PromoProgress";
import type { PromoListProps } from "./promo-expand.types";
import { promoValueParts } from "./promo-format";
import { PROMO_VISIBLE_LIMIT, promoWindowStart } from "./promo-window";

// Desktop view: a row of campaign panels. The open one takes four times the
// width of the others, so the row always fills its container with no empty
// gap. Closed panels show the cover, the discount and the name; the open one
// carries the progress bar and the copy. At most PROMO_VISIBLE_LIMIT panels
// are shown, the window follows the open campaign.
export function PromoExpandStrip(props: PromoListProps) {
  const { campaigns, index, onPick } = props;
  const start = promoWindowStart(campaigns.length, index);
  const entries = campaigns
    .slice(start, start + PROMO_VISIBLE_LIMIT)
    .map((campaign, k) => ({ campaign, i: start + k }));
  return (
    <ol
      aria-label="Ưu đãi đang chạy"
      className="hidden h-[26rem] gap-3 lg:flex xl:h-[28rem]"
    >
      {entries.map(({ campaign, i }) =>
        i === index ? (
          <li
            key={campaign.id}
            className="min-w-0 flex-[4_1_0%] motion-safe:transition-[flex-grow] motion-safe:duration-500 motion-safe:ease-out"
          >
            <OpenPanel {...props} campaign={campaign} />
          </li>
        ) : (
          <li
            key={campaign.id}
            className="min-w-0 flex-[1_1_0%] motion-safe:transition-[flex-grow] motion-safe:duration-500 motion-safe:ease-out"
          >
            <ClosedPanel campaign={campaign} onOpen={() => onPick(i)} />
          </li>
        ),
      )}
    </ol>
  );
}

function OpenPanel({
  campaign,
  campaigns,
  index,
  showControls,
  announce,
  onPrev,
  onNext,
}: PromoListProps & { campaign: PublicVoucherCampaign }) {
  return (
    <div
      aria-current="true"
      className="relative h-full overflow-hidden rounded-2xl bg-[#1E3A5F] text-white"
    >
      <div data-promo-cover="active" className="absolute inset-0">
        {campaign.imageUrl ? (
          <Image
            src={campaign.imageUrl}
            alt=""
            fill
            sizes="(min-width: 1280px) 760px, 640px"
            className="object-cover"
          />
        ) : null}
      </div>
      {campaigns.length > 1 ? (
        <div className="absolute inset-x-5 top-5">
          <PromoProgress campaigns={campaigns} index={index} />
        </div>
      ) : null}
      <div className="absolute inset-x-0 bottom-0 bg-[#1E3A5F] p-6 xl:p-8">
        <PromoActiveCopy
          campaign={campaign}
          showControls={showControls}
          announce={announce}
          onPrev={onPrev}
          onNext={onNext}
        />
      </div>
    </div>
  );
}

function ClosedPanel({
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
      className="group relative block h-full w-full overflow-hidden rounded-2xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F]"
    >
      <span className="absolute inset-0 block bg-zinc-300 dark:bg-zinc-800">
        {campaign.imageUrl ? (
          <Image
            src={campaign.imageUrl}
            alt=""
            fill
            sizes="160px"
            className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.04]"
          />
        ) : null}
      </span>
      <span className="absolute inset-x-0 bottom-0 flex min-w-0 flex-col bg-[#1E3A5F] px-2.5 py-3 text-white xl:px-3.5">
        <span className="truncate text-[13px] font-extrabold tracking-tight xl:text-base">
          {figure.value}
        </span>
        <span className="mt-0.5 line-clamp-2 text-xs leading-snug text-zinc-300">
          {campaign.name}
        </span>
      </span>
    </button>
  );
}
