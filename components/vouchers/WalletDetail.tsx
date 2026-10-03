"use client";

import Link from "next/link";
import { FiArrowLeft, FiGift, FiRefreshCw } from "react-icons/fi";
import {
  formatPromoVnd,
  promoDiscountLabel,
  promoScopeLabel,
} from "@/components/promotions/promo-format";
import { useMe } from "@/hooks/auth";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { useVoucherRealtime } from "@/hooks/useVoucherRealtime";
import { useMyWalletDetail } from "@/hooks/useVouchers";
import type { VoucherWallet } from "@/lib/vouchers/voucher.types";
import { ProductGallery } from "../products/ProductGallery";

function statusLabel(status: VoucherWallet["status"]): string {
  if (status === "used") return "Đã dùng";
  if (status === "expired") return "Hết hạn";
  if (status === "revoked") return "Đã thu hồi";
  return "Còn hiệu lực";
}

function formatDate(iso: string | null): string {
  if (!iso) return "Không giới hạn";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Không giới hạn";
  return date.toLocaleDateString("vi-VN");
}

// Owned voucher detail at /vouchers/w/[walletId]: full discount terms,
// validity and usage state for exactly one account-bound wallet.
export function WalletDetail({ walletId }: { walletId: string }) {
  const rootRef = useBentoReveal<HTMLDivElement>();
  const me = useMe();
  useVoucherRealtime(me.data?.id, false);
  // Guests and failed sessions never reach the owner-only endpoint —
  // the error panel covers them instead of a guaranteed 401.
  const authFailed = me.isError || (me.isSuccess && me.data === null);
  const detail = useMyWalletDetail(walletId, me.isSuccess && me.data !== null);
  const loadFailed = authFailed || detail.isError;
  const item = detail.data ?? null;
  const wallet = item?.wallet ?? null;
  const campaign = item?.campaign ?? null;
  const usable = wallet?.status === "active";
  const gallery = campaign?.images.length
    ? campaign.images
    : wallet?.imageUrl
      ? [wallet.imageUrl]
      : [];

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
        Quay lại ví voucher
      </Link>

      {!loadFailed && detail.isPending && (
        <div
          aria-busy="true"
          className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4"
        >
          <div className="h-64 motion-safe:animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900" />
          <div className="h-64 motion-safe:animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900" />
        </div>
      )}

      {loadFailed && (
        <div
          role="alert"
          data-reveal
          className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          <p className="font-semibold">Không tải được voucher.</p>
          <p className="mt-1 text-xs">
            Voucher có thể thuộc tài khoản khác hoặc bạn chưa đăng nhập.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void detail.refetch()}
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
              Về ví voucher
            </Link>
          </div>
        </div>
      )}

      {wallet && (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            <div data-reveal>
              {gallery.length > 0 ? (
                <ProductGallery images={gallery} name={wallet.campaignName} />
              ) : (
                <div className="flex h-64 w-full items-center justify-center rounded-2xl border border-zinc-200 text-zinc-300 md:h-80 dark:border-zinc-800 dark:text-zinc-700">
                  <FiGift aria-hidden="true" className="h-16 w-16" />
                </div>
              )}
            </div>
            <div
              data-reveal
              className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div>
                <p className="text-[11px] font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                  Voucher gắn tài khoản · Không chia sẻ được
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-balance text-zinc-900 dark:text-zinc-50">
                  {wallet.campaignName}
                </h1>
                <p
                  aria-live="polite"
                  className="mt-2 inline-flex rounded-full border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-300"
                >
                  {statusLabel(wallet.status)}
                </p>
              </div>
              <p className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {promoDiscountLabel(wallet)}
              </p>
              <dl className="divide-y divide-zinc-100 dark:divide-zinc-800">
                <div className="flex items-baseline justify-between gap-3 py-2">
                  <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                    Áp dụng cho
                  </dt>
                  <dd className="text-right text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {promoScopeLabel(wallet.scope)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 py-2">
                  <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                    Đơn tối thiểu
                  </dt>
                  <dd className="text-right text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {wallet.minOrder > 0
                      ? formatPromoVnd(wallet.minOrder)
                      : "Không yêu cầu"}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 py-2">
                  <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                    Ngày nhận
                  </dt>
                  <dd className="text-right text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {formatDate(wallet.grantedAt)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 py-2">
                  <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                    Hạn dùng
                  </dt>
                  <dd className="text-right text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {formatDate(wallet.expiresAt)}
                  </dd>
                </div>
                {wallet.usedAt && (
                  <div className="flex items-baseline justify-between gap-3 py-2">
                    <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                      Đã dùng lúc
                    </dt>
                    <dd className="text-right text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      {formatDate(wallet.usedAt)}
                    </dd>
                  </div>
                )}
              </dl>
              {usable && (
                <div className="flex flex-col gap-2 sm:flex-row">
                  {(wallet.scope === "booking" || wallet.scope === "all") && (
                    <Link
                      href="/booking"
                      scroll={false}
                      prefetch
                      className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      Đặt lịch để dùng
                    </Link>
                  )}
                  {(wallet.scope === "order" || wallet.scope === "all") && (
                    <Link
                      href="/products"
                      scroll={false}
                      prefetch
                      className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
                    >
                      Mua linh kiện để dùng
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
          {campaign?.description && (
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
          )}
        </>
      )}
    </div>
  );
}
