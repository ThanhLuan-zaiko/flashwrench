"use client";

import { FiCheck } from "react-icons/fi";
import { SmartCtaLink } from "@/components/auth/SmartCtaLink";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { HomeHeroTicket } from "./HomeHeroTicket";

const TRUST_POINTS = ["Thợ đã xác thực", "Giá minh bạch", "Bảo hành 30 ngày"];

// Light hero: navy headline and copy on white, one orange booking action and
// an outlined secondary action. The tracking ticket sits on the right on lg
// and stacks below the copy on phones.
export function HomeHero() {
  const rootRef = useBentoReveal<HTMLElement>();

  return (
    <section
      ref={rootRef}
      aria-label="Giới thiệu FlashWrench"
      className="px-4 pt-10 sm:px-6 md:pt-16"
    >
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div className="flex flex-col items-start text-left">
          <p
            data-reveal
            className="text-xs font-semibold tracking-[0.14em] text-zinc-600 uppercase dark:text-zinc-400"
          >
            Sửa xe lưu động · Có mặt trong 30 phút
          </p>
          <h1
            data-reveal
            className="mt-5 text-5xl leading-[1.02] font-extrabold tracking-tight text-balance text-[#1E3A5F] sm:text-6xl lg:text-7xl dark:text-zinc-50"
          >
            Xe hỏng ở đâu, thợ đến đó.
          </h1>
          <p
            data-reveal
            className="mt-6 max-w-xl text-base leading-relaxed text-pretty text-zinc-600 sm:text-lg dark:text-zinc-400"
          >
            Đặt thợ sửa xe tận nơi hoặc cứu hộ khẩn cấp 24/7. Giá báo trước,
            không phát sinh. Theo dõi thợ đang đến trên bản đồ.
          </p>
          <div data-reveal className="mt-8 flex flex-wrap gap-3">
            <span data-tour="booking-cta" className="flex shrink-0">
              <SmartCtaLink
                guestHref="/booking"
                authedHref="/booking"
                guestLabel="Đặt lịch ngay"
                authedLabel="Đặt lịch ngay"
                guestAriaLabel="Đặt lịch ngay không cần tài khoản"
                authedAriaLabel="Đặt lịch ngay"
                className="flex min-h-[44px] items-center justify-center rounded-xl bg-[#F97316] px-6 py-3 text-sm font-bold whitespace-nowrap text-[#0F1E33] transition-colors duration-200 hover:bg-[#EA580C] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] focus-visible:ring-offset-2 motion-safe:active:scale-[0.99]"
              />
            </span>
            <a
              href="#dich-vu"
              className="flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold whitespace-nowrap text-zinc-900 transition-colors duration-200 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] focus-visible:ring-offset-2 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            >
              Xem dịch vụ
            </a>
          </div>
          <ul
            data-reveal
            className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2"
          >
            {TRUST_POINTS.map((point) => (
              <li
                key={point}
                className="flex items-center gap-1.5 text-sm font-medium text-zinc-600"
              >
                <FiCheck
                  aria-hidden="true"
                  className="h-4 w-4 text-[#1E3A5F]"
                />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <HomeHeroTicket />
      </div>
    </section>
  );
}
