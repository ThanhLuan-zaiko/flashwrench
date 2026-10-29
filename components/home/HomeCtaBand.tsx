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
          className="flex flex-col items-start gap-6 rounded-3xl bg-[#1E3A5F] px-6 py-8 md:flex-row md:items-center md:gap-10 md:px-10 md:py-12"
        >
          <Image
            src={logoImage}
            alt=""
            className="h-16 w-auto shrink-0 md:h-20"
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold tracking-tight text-balance text-white sm:text-3xl">
              Hỏng xe giữa đường? FlashWrench tới tận nơi.
            </h2>
            <p className="mt-2 max-w-xl text-base text-zinc-200">
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
              className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[#F97316] px-5 py-2.5 text-sm font-semibold text-[#0F1E33] transition-colors duration-200 hover:bg-[#EA580C] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E3A5F] motion-safe:active:scale-[0.99]"
            />
            <Link
              href="/rescue"
              data-tour="rescue-cta"
              className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E3A5F] motion-safe:active:scale-[0.99]"
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
