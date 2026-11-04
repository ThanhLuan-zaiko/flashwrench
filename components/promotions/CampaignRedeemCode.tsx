"use client";

import Link from "next/link";
import { useMe } from "@/hooks/auth";
import { useCampaignRedeemCode } from "@/hooks/useVoucherCode";
import { buildLoginHref } from "@/lib/auth/auth-redirect";
import {
  campaignDetailHref,
  walletDetailHref,
} from "../vouchers/voucher-detail-href";
import { CopyCodeButton } from "./CopyCodeButton";

// Per-viewer redeem code on the public campaign page. The code only
// renders when this signed-in customer can still claim it; guests get a
// login teaser, staff and errors see nothing.
export function CampaignRedeemCode({
  slug,
  hasRedeemCode,
}: {
  slug: string;
  hasRedeemCode: boolean;
}) {
  const me = useMe();
  const isCustomer = me.isSuccess && me.data?.role === "customer";
  const codeQuery = useCampaignRedeemCode(slug, isCustomer && hasRedeemCode);

  if (!hasRedeemCode) return null;

  if (me.isPending || (isCustomer && codeQuery.isPending)) {
    return (
      <div
        aria-hidden="true"
        className="min-h-[44px] rounded-xl bg-zinc-100 motion-safe:animate-pulse dark:bg-zinc-800"
      />
    );
  }

  if (me.isSuccess && me.data === null) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 p-3 dark:border-zinc-700">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Chương trình có mã ưu đãi riêng
        </p>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          Đăng nhập bằng tài khoản đủ điều kiện để xem mã và dùng ngay khi đặt
          lịch hoặc thanh toán.
        </p>
        <Link
          href={buildLoginHref(campaignDetailHref(slug))}
          className="mt-2 inline-flex min-h-[44px] items-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] bg-[#1D4ED8] text-white hover:bg-[#1E40AF] dark:bg-[#60A5FA] dark:text-[#111111] dark:hover:bg-[#93C5FD]"
        >
          Đăng nhập để xem mã
        </Link>
      </div>
    );
  }

  if (!isCustomer || codeQuery.isError || !codeQuery.data) return null;
  const visibility = codeQuery.data;

  if (visibility.status === "claimable") {
    return (
      <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
        <p className="text-xs font-semibold tracking-wide text-zinc-600 uppercase dark:text-zinc-400">
          Mã ưu đãi của bạn
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className="font-mono text-xl font-bold tracking-widest text-zinc-900 dark:text-zinc-50">
            {visibility.code}
          </span>
          <CopyCodeButton code={visibility.code} />
        </div>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          Nhập mã ở bước xác nhận đặt lịch hoặc thanh toán để nhận voucher và
          dùng ngay.
        </p>
      </div>
    );
  }

  if (visibility.status === "owned") {
    return (
      <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
        <p className="text-sm text-zinc-800 dark:text-zinc-400">
          Bạn đã có voucher này trong ví.
        </p>
        <Link
          href={walletDetailHref(visibility.walletId)}
          className="mt-2 inline-flex min-h-[44px] items-center rounded-xl border border-zinc-600 px-4 py-2 text-sm font-semibold text-[#111111] transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-400 dark:text-zinc-100 dark:hover:bg-zinc-900"
        >
          Xem voucher
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 p-3 text-sm text-zinc-800 dark:border-zinc-800 dark:text-zinc-400">
      Bạn đã nhận đủ số lượt của chương trình này.
    </div>
  );
}
