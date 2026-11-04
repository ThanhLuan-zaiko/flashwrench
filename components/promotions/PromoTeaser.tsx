"use client";

import Link from "next/link";
import { FiGift } from "react-icons/fi";
import { useMe } from "@/hooks/auth";
import { useVoucherRealtime } from "@/hooks/useVoucherRealtime";
import { usePublicCampaigns } from "@/hooks/useVouchers";
import { campaignDetailHref } from "../vouchers/voucher-detail-href";
import {
  type PromoAudience,
  promoAppliesTo,
  promoDiscountLabel,
} from "./promo-format";

type PromoTeaserProps = {
  audience?: PromoAudience;
};

const LINK_CLASSES =
  "font-bold text-[#1D4ED8] underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] dark:text-blue-300 dark:focus-visible:ring-zinc-100";

// One-line promotion nudge for booking and checkout: the top running
// promotion for the page audience, then a link that sends guests to register
// and accounts to their wallet. It sits inside a strip that already holds
// other content, so it has no box of its own.
export function PromoTeaser({ audience }: PromoTeaserProps) {
  useVoucherRealtime(undefined, false);
  const me = useMe();
  const campaigns = usePublicCampaigns(true);

  const guest = me.isSuccess && me.data === null;
  const items = (campaigns.data ?? []).filter((campaign) =>
    audience ? promoAppliesTo(campaign, audience) : true,
  );
  if (campaigns.isPending || campaigns.isError || items.length === 0) {
    return null;
  }
  const top = items[0];
  const href = guest ? "/register" : "/vouchers";
  const cta = guest ? "Tạo tài khoản để nhận" : "Xem ví của tôi";

  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
      <FiGift aria-hidden="true" className="h-4 w-4 shrink-0" />
      <Link
        href={campaignDetailHref(top.slug)}
        scroll={false}
        prefetch
        className={LINK_CLASSES}
      >
        {top.name} · {promoDiscountLabel(top)}
      </Link>
      {me.isPending ? null : (
        <>
          <span aria-hidden="true">·</span>
          <Link href={href} scroll={false} prefetch className={LINK_CLASSES}>
            {cta}
          </Link>
        </>
      )}
    </p>
  );
}
