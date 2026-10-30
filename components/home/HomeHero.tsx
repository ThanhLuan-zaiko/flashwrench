"use client";

import Image from "next/image";
import { FiCheck } from "react-icons/fi";
import { SmartCtaLink } from "@/components/auth/SmartCtaLink";
import { useBentoReveal } from "@/hooks/useBentoReveal";

const TRUST_POINTS = ["Thợ đã xác thực", "Giá minh bạch", "Bảo hành 30 ngày"];

// Full-width navy band for the home hero, in the same style as the product and
// campaign bands: headline, booking actions and trust points on the left, the
// service illustration on the right.
// It sits directly under the sticky site header and rounds its bottom corners.
export function HomeHero() {
  const rootRef = useBentoReveal<HTMLElement>();

  return (
    <section
      ref={rootRef}
      aria-label="Giới thiệu FlashWrench"
      className="rounded-b-[2.5rem] bg-[#1E3A5F] px-4 pt-10 pb-12 text-white sm:px-6 md:pt-14 md:pb-16"
    >
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="flex flex-col items-start text-left">
          <p
            data-reveal
            className="text-xs font-semibold tracking-[0.14em] text-zinc-200 uppercase"
          >
            Sửa xe lưu động · Có mặt trong 30 phút
          </p>
          <h1
            data-reveal
            className="mt-5 text-5xl leading-[1.02] font-extrabold tracking-tight text-balance sm:text-6xl"
          >
            Xe hỏng ở đâu, thợ đến đó.
          </h1>
          <p
            data-reveal
            className="mt-6 max-w-xl text-base leading-relaxed text-pretty text-zinc-200 sm:text-lg"
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
                className="flex min-h-[44px] items-center justify-center rounded-xl bg-[#F97316] px-6 py-3 text-sm font-bold whitespace-nowrap text-[#0F1E33] transition-colors duration-200 hover:bg-[#EA580C] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E3A5F] motion-safe:active:scale-[0.99]"
              />
            </span>
            <a
              href="#dich-vu"
              className="flex min-h-[44px] items-center justify-center rounded-xl border border-white/40 px-6 py-3 text-sm font-semibold whitespace-nowrap text-white transition-colors duration-200 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E3A5F] motion-safe:active:scale-[0.99]"
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
                className="flex items-center gap-1.5 text-sm font-medium text-zinc-100"
              >
                <FiCheck aria-hidden="true" className="h-4 w-4 shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <Image
          data-reveal
          src="/images/home/hero-auto-service.png"
          alt="Thợ sửa xe đang làm việc cùng chiếc xe màu cam"
          width={776}
          height={688}
          className="mx-auto h-80 w-auto sm:h-96"
        />
      </div>
    </section>
  );
}
