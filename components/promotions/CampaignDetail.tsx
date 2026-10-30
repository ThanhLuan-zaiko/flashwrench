"use client";

import Link from "next/link";
import { FiRefreshCw } from "react-icons/fi";
import { BackLink } from "@/components/ui/BackLink";
import { BRAND_PRIMARY_BUTTON } from "@/components/ui/brand";
import { useMe } from "@/hooks/auth";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { useVoucherRealtime } from "@/hooks/useVoucherRealtime";
import { usePublicCampaign } from "@/hooks/useVouchers";
import { ProductGallery } from "../products/ProductGallery";
import { CampaignHero } from "./CampaignHero";
import { CampaignHowToGet } from "./CampaignHowToGet";
import { CampaignTerms } from "./CampaignTerms";
import { promoTermsLabel, promoValueParts } from "./promo-format";

// Public campaign detail at /vouchers/c/[slug]: a navy offer band with the
// primary action, the gallery and terms, then how to earn the voucher.
// Guests learn how to get the voucher, accounts jump straight to their wallet.
export function CampaignDetail({ slug }: { slug: string }) {
  const rootRef = useBentoReveal<HTMLDivElement>();
  useVoucherRealtime(undefined, false);
  const me = useMe();
  const campaignQuery = usePublicCampaign(slug, true);
  const campaign = campaignQuery.data ?? null;
  const guest = me.isSuccess && me.data === null;

  const action = me.isPending ? (
    <span
      aria-hidden="true"
      className="flex h-11 w-44 motion-safe:animate-pulse rounded-xl bg-white/20"
    />
  ) : (
    <Link
      href={guest ? "/register" : "/vouchers"}
      scroll={false}
      prefetch
      className={BRAND_PRIMARY_BUTTON}
    >
      {guest ? "Tạo tài khoản để nhận" : "Xem ví voucher của tôi"}
    </Link>
  );

  return (
    <div ref={rootRef} className="flex flex-col gap-4 md:gap-6">
      {!campaign && <BackLink href="/vouchers" label="Quay lại ưu đãi" />}

      {campaignQuery.isPending && (
        <div
          aria-busy="true"
          className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4"
        >
          <div className="h-64 motion-safe:animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900" />
          <div className="h-64 motion-safe:animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900" />
        </div>
      )}

      {campaignQuery.isError && (
        <div
          role="alert"
          data-reveal
          className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          <p className="font-semibold">
            Ưu đãi không tồn tại hoặc đã kết thúc.
          </p>
          <p className="mt-1 text-xs">
            Chương trình có thể đã tắt hoặc phát hết số lượng.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void campaignQuery.refetch()}
              className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold transition-colors duration-200 hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 motion-safe:active:scale-[0.99] dark:border-red-800 dark:hover:bg-red-950"
            >
              <FiRefreshCw aria-hidden="true" className="h-4 w-4" />
              Thử tải lại
            </button>
            <Link
              href="/vouchers"
              scroll={false}
              className="flex min-h-[44px] items-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Xem ưu đãi đang chạy
            </Link>
          </div>
        </div>
      )}

      {campaign && (
        <>
          <CampaignHero
            name={campaign.name}
            offer={promoValueParts(campaign)}
            terms={promoTermsLabel(campaign)}
            action={action}
          />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:gap-4">
            <div data-reveal className="md:col-span-7">
              <ProductGallery images={campaign.images} name={campaign.name} />
            </div>
            <div className="md:col-span-5">
              <CampaignTerms campaign={campaign} />
            </div>
          </div>
          {campaign.description ? (
            <section
              data-reveal
              aria-label="Mô tả chương trình"
              className="rounded-2xl border border-zinc-200 bg-white p-5 md:p-6 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Về chương trình này
              </h2>
              <p className="mt-1 text-sm whitespace-pre-line text-zinc-600 dark:text-zinc-400">
                {campaign.description}
              </p>
            </section>
          ) : null}
          <CampaignHowToGet />
        </>
      )}
    </div>
  );
}
