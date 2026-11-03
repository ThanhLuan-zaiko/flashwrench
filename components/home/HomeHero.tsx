"use client";

import { SmartCtaLink } from "@/components/auth/SmartCtaLink";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";
import { HeroServiceFan } from "./HeroServiceFan";

// Headline facts shown under the actions. Each one repeats a promise already
// made on the booking and rescue pages.
const FACTS = [
  { value: "30 phút", label: "Có mặt sau khi đặt" },
  { value: "24/7", label: "Cứu hộ khẩn cấp" },
  { value: "30 ngày", label: "Bảo hành công việc" },
];

// Full-width navy band for the home hero, in the same layered style as the
// auth showcase: headline, actions and facts on the left, fanned service cards
// on the right. Without photographed services the band drops the right column
// instead of leaving an empty box.
// It sits directly under the sticky site header and rounds its bottom corners.
export function HomeHero({ heroServices }: { heroServices: ServiceItem[] }) {
  const rootRef = useBentoReveal<HTMLElement>();
  const hasTiles = heroServices.length > 0;

  return (
    <section
      ref={rootRef}
      aria-label="Giới thiệu FlashWrench"
      className="rounded-b-[2.5rem] bg-[#FACC15] px-4 pt-8 pb-10 text-[#111111] sm:px-6 md:pt-10 md:pb-12 lg:px-0"
    >
      <div
        className={`mx-auto grid w-full max-w-7xl items-center gap-10 lg:gap-14 lg:px-8 ${hasTiles ? "lg:grid-cols-2" : ""}`}
      >
        <div className="flex flex-col items-start text-left">
          <p
            data-reveal
            className="text-xs font-semibold tracking-[0.14em] text-[#111111]/85 uppercase"
          >
            Sửa xe lưu động · Có mặt trong 30 phút
          </p>
          <h1
            data-reveal
            className="mt-5 text-2xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-3xl lg:text-4xl"
          >
            Xe hỏng ở đâu, thợ đến đó.
          </h1>
          <p
            data-reveal
            className="mt-6 max-w-xl text-base leading-relaxed text-pretty text-[#111111]/85"
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
                className="flex min-h-[44px] items-center justify-center rounded-xl bg-[#111111] px-6 py-3 text-sm font-bold whitespace-nowrap text-white transition-colors duration-200 hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FACC15] motion-safe:active:scale-[0.99]"
              />
            </span>
            <a
              href="#dich-vu"
              className="flex min-h-[44px] items-center justify-center rounded-xl border border-[#111111]/40 px-6 py-3 text-sm font-semibold whitespace-nowrap text-[#111111] transition-colors duration-200 hover:bg-[#111111]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FACC15] motion-safe:active:scale-[0.99]"
            >
              Xem dịch vụ
            </a>
          </div>
          <ul
            data-reveal
            className="mt-10 grid w-full max-w-md grid-cols-3 gap-4 border-t border-[#111111]/20 pt-6"
          >
            {FACTS.map((fact) => (
              <li key={fact.value}>
                <p className="text-xl font-extrabold tracking-tight sm:text-2xl">
                  {fact.value}
                </p>
                <p className="mt-1 text-xs text-[#111111]/85 sm:text-sm">
                  {fact.label}
                </p>
              </li>
            ))}
          </ul>
        </div>
        {hasTiles ? <HeroServiceFan services={heroServices} /> : null}
      </div>
    </section>
  );
}
