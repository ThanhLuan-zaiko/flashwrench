"use client";

import Image from "next/image";
import Link from "next/link";
import { FiPhoneCall, FiUserPlus } from "react-icons/fi";
import logoImage from "@/asset/flashwrench.png";
import { SmartCtaLink } from "@/components/auth/SmartCtaLink";
import { useBentoReveal } from "@/hooks/useBentoReveal";

// Inverted closing band: hierarchy comes from the monochrome swap, not from
// color. The mascot finishes the page the same way it opens the hero.
export function HomeCtaBand() {
  const rootRef = useBentoReveal<HTMLElement>();

  return (
    <section ref={rootRef} aria-label="Bắt đầu với FlashWrench">
      <div className="mx-auto w-full max-w-6xl px-4 pb-14 sm:px-6 md:pb-24">
        <div
          data-reveal
          className="flex flex-col items-start gap-6 rounded-3xl bg-zinc-900 px-6 py-8 md:flex-row md:items-center md:gap-10 md:px-10 md:py-12 dark:bg-zinc-100"
        >
          <Image
            src={logoImage}
            alt=""
            className="h-16 w-auto shrink-0 md:h-20"
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold tracking-tight text-balance text-white sm:text-3xl dark:text-zinc-900">
              Hỏng xe giữa đường? FlashWrench tới tận nơi.
            </h2>
            <p className="mt-2 max-w-xl text-sm text-zinc-300 sm:text-base dark:text-zinc-600">
              Đặt thợ trong một phút, hoặc gọi cứu hộ khẩn cấp bất kể ngày đêm.
              Giá chốt trước khi thợ xuất phát.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto md:flex-col lg:flex-row">
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
              className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 transition-colors duration-200 hover:bg-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 motion-safe:active:scale-[0.99] dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-700 dark:focus-visible:ring-zinc-900 dark:focus-visible:ring-offset-zinc-100"
            />
            <Link
              href="/rescue"
              data-tour="rescue-cta"
              className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-zinc-600 px-5 py-2.5 text-sm font-semibold text-zinc-100 transition-colors duration-200 hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 motion-safe:active:scale-[0.99] dark:border-zinc-300 dark:text-zinc-800 dark:hover:bg-zinc-200 dark:focus-visible:ring-zinc-900 dark:focus-visible:ring-offset-zinc-100"
            >
              <FiPhoneCall aria-hidden="true" className="h-4 w-4" />
              Cứu hộ khẩn cấp
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
