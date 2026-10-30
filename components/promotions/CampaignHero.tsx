import Image from "next/image";
import type { ReactNode } from "react";
import { BackLink } from "@/components/ui/BackLink";
import type { PromoValueParts } from "./promo-format";

type CampaignHeroProps = {
  name: string;
  offer: PromoValueParts;
  terms: string;
  action: ReactNode;
};

// Full-bleed navy band for one public campaign. It starts directly under the
// site header, carries the back link, the headline and the primary action on
// the left, and a white coupon stub with the gift on the right.
export function CampaignHero({
  name,
  offer,
  terms,
  action,
}: CampaignHeroProps) {
  return (
    <section
      data-reveal
      aria-label="Tóm tắt ưu đãi"
      className="relative left-1/2 w-screen -translate-x-1/2 -mt-6 overflow-hidden rounded-b-[2.5rem] bg-[#1E3A5F] px-4 pt-6 pb-10 text-white sm:px-6 md:pb-12 lg:pt-8"
    >
      <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-2 lg:gap-14">
        <div className="flex min-w-0 flex-col gap-4">
          <BackLink href="/vouchers" label="Quay lại ưu đãi" onDark />
          <p className="text-xs font-semibold tracking-[0.14em] text-zinc-200 uppercase">
            Khuyến mãi · Voucher gắn tài khoản
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-balance lg:text-5xl">
            {name}
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-zinc-200">
            {terms}
          </p>
          <div className="flex flex-wrap gap-3">{action}</div>
        </div>

        <div className="mx-auto flex w-full max-w-xs flex-col items-center gap-2 lg:mx-0 lg:ml-auto">
          <Image
            src="/images/isometric/gift.svg"
            alt=""
            width={66}
            height={77}
            className="h-28 w-28 sm:h-32 sm:w-32"
          />
          <div className="relative w-full rounded-2xl bg-white p-5 text-center text-zinc-900">
            <span
              aria-hidden="true"
              className="absolute top-1/2 -left-3 h-6 w-6 -translate-y-1/2 rounded-full bg-[#1E3A5F]"
            />
            <span
              aria-hidden="true"
              className="absolute top-1/2 -right-3 h-6 w-6 -translate-y-1/2 rounded-full bg-[#1E3A5F]"
            />
            <p className="text-xs font-semibold tracking-[0.14em] text-[#1E3A5F] uppercase">
              Ưu đãi của bạn
            </p>
            <p className="mt-1 text-5xl font-extrabold tracking-tight text-[#1E3A5F]">
              {offer.value}
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-700">
              {offer.unit}
            </p>
            <div
              aria-hidden="true"
              className="mt-4 border-t border-dashed border-zinc-300 pt-3 text-xs text-zinc-500"
            >
              FlashWrench · Voucher của bạn
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
