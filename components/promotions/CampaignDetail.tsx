"use client";

import Link from "next/link";
import { FiArrowLeft, FiRefreshCw } from "react-icons/fi";
import { useMe } from "@/hooks/auth";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { useVoucherRealtime } from "@/hooks/useVoucherRealtime";
import { usePublicCampaign } from "@/hooks/useVouchers";
import { ProductGallery } from "../products/ProductGallery";
import { CampaignRedeemCode } from "./CampaignRedeemCode";
import { CampaignShareButton } from "./CampaignShareButton";
import {
  promoConditionLabel,
  promoDiscountLabel,
  promoExpiryLabel,
  promoScopeLabel,
} from "./promo-format";

function formatDate(iso: string | null): string {
  if (!iso) return "Không giới hạn";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Không giới hạn";
  return date.toLocaleDateString("vi-VN");
}

// Public campaign detail at /vouchers/c/[slug]: full terms and gallery
// for one running promotion. Guests learn how to get the voucher,
// accounts jump straight to their wallet.
export function CampaignDetail({ slug }: { slug: string }) {
  const rootRef = useBentoReveal<HTMLDivElement>();
  useVoucherRealtime(undefined, false);
  const me = useMe();
  const campaignQuery = usePublicCampaign(slug, true);
  const campaign = campaignQuery.data ?? null;
  const guest = me.isSuccess && me.data === null;
  const remaining =
    campaign && campaign.totalLimit > 0
      ? Math.max(0, campaign.totalLimit - campaign.grantedCount)
      : null;

  return (
    <div ref={rootRef} className="flex flex-col gap-4">
      <Link
        href="/vouchers"
        scroll={false}
        prefetch
        data-reveal
        className="flex w-fit min-h-[44px] items-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        <FiArrowLeft aria-hidden="true" className="h-4 w-4" />
        Quay lại ưu đãi
      </Link>

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
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            <div data-reveal>
              <ProductGallery images={campaign.images} name={campaign.name} />
            </div>
            <div
              data-reveal
              className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div>
                <p className="text-[11px] font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                  Khuyến mãi · Voucher gắn tài khoản
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-balance text-zinc-900 dark:text-zinc-50">
                  {campaign.name}
                </h1>
                <p className="mt-2 flex flex-wrap gap-1.5">
                  <span className="rounded-full border border-zinc-300 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                    Đang chạy
                  </span>
                </p>
              </div>
              <p className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {promoDiscountLabel(campaign)}
              </p>
              <dl className="divide-y divide-zinc-100 dark:divide-zinc-800">
                <div className="flex items-baseline justify-between gap-3 py-2">
                  <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                    Áp dụng cho
                  </dt>
                  <dd className="text-right text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {promoScopeLabel(campaign.scope)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 py-2">
                  <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                    Điều kiện đơn
                  </dt>
                  <dd className="text-right text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {promoConditionLabel(campaign)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 py-2">
                  <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                    Bắt đầu
                  </dt>
                  <dd className="text-right text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {formatDate(campaign.startAt)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 py-2">
                  <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                    Kết thúc
                  </dt>
                  <dd className="text-right text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {promoExpiryLabel(campaign)}
                  </dd>
                </div>
                {remaining !== null && (
                  <div className="flex items-baseline justify-between gap-3 py-2">
                    <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                      Suất còn lại
                    </dt>
                    <dd className="text-right text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      {remaining} / {campaign.totalLimit}
                    </dd>
                  </div>
                )}
              </dl>
              <CampaignRedeemCode
                slug={campaign.slug}
                hasRedeemCode={campaign.hasRedeemCode}
              />
              <div className="flex flex-row gap-2">
                {me.isPending ? (
                  <span
                    aria-hidden="true"
                    className="flex min-h-[44px] flex-1 motion-safe:animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800"
                  />
                ) : (
                  <Link
                    href={guest ? "/register" : "/vouchers"}
                    scroll={false}
                    prefetch
                    className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-zinc-900 px-3 py-2 text-center text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    {guest ? "Tạo tài khoản để nhận" : "Xem ví voucher của tôi"}
                  </Link>
                )}
                <CampaignShareButton slug={campaign.slug} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            {campaign.description ? (
              <section
                data-reveal
                aria-label="Mô tả chương trình"
                className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  Về chương trình này
                </h2>
                <p className="mt-1 text-sm whitespace-pre-line text-zinc-600 dark:text-zinc-400">
                  {campaign.description}
                </p>
              </section>
            ) : null}
            <section
              data-reveal
              aria-label="Cách nhận voucher"
              className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Cách nhận voucher
              </h2>
              <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
                <li>Tạo tài khoản khách hàng miễn phí.</li>
                <li>
                  Đặt lịch sửa xe hoặc mua linh kiện để đủ điều kiện — hệ thống
                  tự phát voucher vào ví.
                </li>
                <li>
                  Mỗi voucher chỉ dùng được trên đúng tài khoản được phát.
                </li>
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
