"use client";

import Link from "next/link";
import { FiArrowRight, FiCheck, FiUserPlus } from "react-icons/fi";
import { SmartCtaLink } from "@/components/auth/SmartCtaLink";
import { TourButton } from "@/components/tour/TourButton";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { HomeHeroTicket } from "./HomeHeroTicket";
import { HOME_TOUR_NAME } from "./tour/home-tour.steps";

const TRUST_POINTS = ["Thợ đã xác thực", "Giá minh bạch", "Theo dõi tiến độ"];

// Navy brand panel: copy and the primary booking action on the left, a
// status preview on the right. Orange is reserved for the booking button.
export function HomeHero() {
  const rootRef = useBentoReveal<HTMLElement>();

  return (
    <section
      ref={rootRef}
      aria-label="Giới thiệu FlashWrench"
      className="px-4 pt-4 sm:px-6 md:pt-8"
    >
      <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-3xl bg-[#1E3A5F] px-6 py-10 text-white sm:px-10 md:py-14 lg:px-14 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <p data-reveal>
              <span className="rounded-full border border-white/20 px-3 py-1 text-[11px] font-semibold tracking-wide text-zinc-200 uppercase">
                FlashWrench · Sửa xe lưu động
              </span>
            </p>
            <h1
              data-reveal
              className="mt-5 max-w-3xl text-4xl font-bold tracking-tight text-balance text-white sm:text-5xl lg:text-6xl"
            >
              Sửa xe tận nơi, khỏi lo dọc đường.
            </h1>
            <p
              data-reveal
              className="mt-4 max-w-xl text-base text-balance text-zinc-200"
            >
              Đặt thợ lưu động, cứu hộ khẩn cấp 24/7 với bảng giá minh bạch.
              Theo dõi tiến độ theo thời gian thực.
            </p>
            <div
              data-reveal
              className="mt-8 flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap"
            >
              <span data-tour="booking-cta" className="flex w-full sm:w-auto">
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
                  className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#F97316] px-6 py-3 text-sm font-semibold text-[#0F1E33] transition-colors duration-200 hover:bg-[#EA580C] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E3A5F] motion-safe:active:scale-[0.99]"
                />
              </span>
              <Link
                href="#dich-vu"
                className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white motion-safe:active:scale-[0.99]"
              >
                Xem dịch vụ
                <FiArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <TourButton
                tour={HOME_TOUR_NAME}
                ariaLabel="Bắt đầu hướng dẫn đặt lịch"
                variant="inverse"
              />
            </div>
            <ul
              data-reveal
              className="mt-8 flex flex-wrap items-center justify-center gap-2 lg:justify-start"
            >
              {TRUST_POINTS.map((point) => (
                <li
                  key={point}
                  className="flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-zinc-200"
                >
                  <FiCheck aria-hidden="true" className="h-3.5 w-3.5" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <HomeHeroTicket />
        </div>
      </div>
    </section>
  );
}
