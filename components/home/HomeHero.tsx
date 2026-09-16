"use client";

import Link from "next/link";
import { FiArrowRight, FiCheck, FiUserPlus } from "react-icons/fi";
import { SmartCtaLink } from "@/components/auth/SmartCtaLink";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { buildBookingHref, buildLoginHref } from "@/lib/auth/auth-redirect";

const TRUST_POINTS = ["Thợ đã xác thực", "Giá minh bạch", "Theo dõi tiến độ"];

// Centered big type hero. Hierarchy comes from type size only,
// monochrome surfaces per skill rule 7.
export function HomeHero() {
  const rootRef = useBentoReveal<HTMLElement>();

  return (
    <section ref={rootRef} aria-label="Giới thiệu FlashWrench">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 pt-12 pb-10 text-center sm:px-6 md:pt-20 md:pb-14">
        <p data-reveal>
          <span className="rounded-full border border-zinc-200 px-3 py-1 text-[11px] font-semibold tracking-wide text-zinc-500 uppercase dark:border-zinc-800 dark:text-zinc-400">
            FlashWrench · Sửa xe lưu động
          </span>
        </p>
        <h1
          data-reveal
          className="mt-5 max-w-4xl text-5xl font-bold tracking-tight text-balance text-zinc-900 sm:text-6xl lg:text-7xl dark:text-zinc-50"
        >
          Sửa xe tận nơi, khỏi lo dọc đường.
        </h1>
        <p
          data-reveal
          className="mx-auto mt-4 max-w-xl text-sm text-balance text-zinc-600 sm:text-base dark:text-zinc-400"
        >
          Đặt thợ lưu động, cứu hộ khẩn cấp 24/7 với bảng giá minh bạch. Theo
          dõi tiến độ theo thời gian thực.
        </p>
        <div
          data-reveal
          className="mt-7 flex w-full flex-col gap-2 sm:w-auto sm:flex-row"
        >
          <SmartCtaLink
            guestHref={buildLoginHref(buildBookingHref())}
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
            guestAriaLabel="Đăng nhập để đặt lịch ngay"
            authedAriaLabel="Đặt lịch ngay"
            className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-950"
          />
          <Link
            href="#dich-vu"
            className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-800 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Xem dịch vụ
            <FiArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
        <ul
          data-reveal
          className="mt-8 flex flex-wrap items-center justify-center gap-2"
        >
          {TRUST_POINTS.map((point) => (
            <li
              key={point}
              className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-300"
            >
              <FiCheck aria-hidden="true" className="h-3.5 w-3.5" />
              {point}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
