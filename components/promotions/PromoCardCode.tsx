"use client";

import Link from "next/link";
import { buildLoginHref } from "@/lib/auth/auth-redirect";
import { CopyCodeButton } from "./CopyCodeButton";

export type PromoCardRedeem =
  | { status: "code"; code: string }
  | { status: "login" };

// Typed redeem code shown right on a /vouchers shelf card: customers
// who can still claim see the code with a copy button, guests get a
// login teaser, everyone else gets nothing (the prop stays undefined).
export function PromoCardCode({ redeem }: { redeem: PromoCardRedeem }) {
  if (redeem.status === "login") {
    return (
      <div className="mt-2 rounded-xl border border-dashed border-zinc-300 p-3 dark:border-zinc-700">
        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
          Chương trình có mã ưu đãi riêng
        </p>
        <Link
          href={buildLoginHref("/vouchers")}
          className="mt-1.5 inline-flex min-h-[44px] items-center rounded-xl px-4 py-2 text-xs font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] bg-[#1D4ED8] text-white hover:bg-[#1E40AF] dark:bg-[#60A5FA] dark:text-[#111111] dark:hover:bg-[#93C5FD]"
        >
          Đăng nhập để xem mã
        </Link>
      </div>
    );
  }
  return (
    <div className="mt-2 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
      <p className="text-xs font-semibold tracking-wide text-zinc-600 uppercase dark:text-zinc-400">
        Mã của bạn
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <span className="font-mono text-base font-bold tracking-widest text-zinc-900 dark:text-zinc-50">
          {redeem.code}
        </span>
        <CopyCodeButton code={redeem.code} />
      </div>
      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
        Nhập ở bước đặt lịch hoặc thanh toán để nhận và dùng ngay.
      </p>
    </div>
  );
}
