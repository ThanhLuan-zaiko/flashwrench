"use client";

import Link from "next/link";
import { useRef } from "react";
import { FiArrowRight, FiUserPlus } from "react-icons/fi";
import { SmartCtaLink } from "@/components/auth/SmartCtaLink";
import { useChapterMotion } from "@/hooks/useChapterMotion";
import { MaskLines } from "./MaskLines";

// Closing chapter: one large statement on the page surface, then the booking
// button (the page's orange action) and the rescue link. No card or banner.
export function HomeCtaBand() {
  const rootRef = useRef<HTMLElement>(null);
  useChapterMotion(rootRef);

  return (
    <section ref={rootRef} aria-label="Bắt đầu với FlashWrench">
      <div className="mx-auto max-w-7xl w-full px-4 pt-6 pb-16 sm:px-6 md:pt-6 md:pb-16 lg:px-8">
        <span
          data-rule
          aria-hidden="true"
          className="block h-px origin-left bg-zinc-200 dark:bg-zinc-800"
        />
        <div className="grid grid-cols-1 gap-8 pt-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-16 md:pt-10">
          <div>
            <MaskLines
              lines={["Hỏng xe giữa đường?", "Thợ tới tận nơi."]}
              className="text-3xl leading-tight font-bold tracking-tight text-[#111111] md:text-4xl dark:text-zinc-50"
            />
            <p
              data-chapter-row
              className="mt-4 max-w-xl text-base text-zinc-600 dark:text-zinc-400"
            >
              Đặt thợ trong một phút, hoặc gọi cứu hộ khẩn cấp bất kể ngày đêm.
              Giá chốt trước khi thợ xuất phát.
            </p>
          </div>
          <div
            data-chapter-row
            className="flex flex-col items-start gap-3 sm:flex-row sm:items-center md:flex-col md:items-stretch lg:flex-row lg:items-center"
          >
            <SmartCtaLink
              guestHref="/booking"
              authedHref="/booking"
              guestLabel={
                <>
                  <FiUserPlus aria-hidden="true" className="h-4 w-4" />
                  Đặt lịch ngay
                </>
              }
              authedLabel={
                <>
                  <FiUserPlus aria-hidden="true" className="h-4 w-4" />
                  Đặt lịch ngay
                </>
              }
              guestAriaLabel="Đặt lịch ngay không cần tài khoản"
              authedAriaLabel="Đặt lịch ngay"
              className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[#111111] px-6 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2 motion-safe:active:scale-[0.99] dark:focus-visible:ring-offset-zinc-950"
            />
            <Link
              href="/rescue"
              data-tour="rescue-cta"
              className="inline-flex min-h-11 items-center justify-center gap-1.5 text-sm font-bold text-[#1D4ED8] underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] dark:text-blue-300 dark:focus-visible:ring-zinc-100"
            >
              Cứu hộ khẩn cấp
              <FiArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
