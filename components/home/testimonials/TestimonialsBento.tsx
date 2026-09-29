"use client";

import { FiMessageSquare } from "react-icons/fi";
import { Stars } from "@/components/feedback/Stars";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import type { LandingReview } from "@/lib/home/landing-reviews.service";
import { RealReviewCard } from "./RealReviewCard";
import {
  TESTIMONIAL_HERO_INDEX,
  TESTIMONIAL_WIDE_INDEXES,
  TESTIMONIALS,
} from "./testimonials.data";

function spanFor(index: number): string {
  if (index === TESTIMONIAL_HERO_INDEX) {
    return "sm:col-span-2 lg:col-span-2 lg:row-span-2";
  }
  if (TESTIMONIAL_WIDE_INDEXES.includes(index)) {
    return "sm:col-span-2 lg:col-span-2";
  }
  return "";
}

// Customer quote wall. The freshest real reviews (fetched server-side)
// lead the section; the curated highlight wall follows. One hero quote,
// two wide ones and four compact ones fill lg:grid-cols-4 with no gaps
// (seven entries pinned by tests).
export function TestimonialsBento({
  realItems,
}: {
  realItems: LandingReview[];
}) {
  const rootRef = useBentoReveal<HTMLElement>();

  return (
    <section ref={rootRef} aria-label="Đánh giá từ khách hàng">
      <div className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6 md:pb-20">
        <div data-reveal className="max-w-2xl">
          <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            Khách hàng nói gì
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance text-zinc-900 sm:text-4xl dark:text-zinc-50">
            Niềm tin được góp từ từng chuyến xe.
          </h2>
          <p className="mt-2 text-sm text-zinc-600 sm:text-base dark:text-zinc-400">
            Đánh giá thật từ người dùng dịch vụ sửa xe lưu động, cứu hộ và mua
            phụ tùng trên FlashWrench.
          </p>
        </div>
        {realItems.length > 0 && (
          <>
            <p
              data-reveal
              className="mt-8 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400"
            >
              Đánh giá mới nhất từ khách hàng
            </p>
            <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
              {realItems.map((review) => (
                <RealReviewCard key={review.id} review={review} />
              ))}
            </ul>
            <p
              data-reveal
              className="mt-8 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400"
            >
              Câu chuyện tiêu biểu
            </p>
          </>
        )}
        <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
          {TESTIMONIALS.map((testimonial, index) => {
            const hero = index === TESTIMONIAL_HERO_INDEX;
            return (
              <li
                key={testimonial.id}
                data-reveal
                className={`${spanFor(index)} flex flex-col justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4 md:p-5 dark:border-zinc-800 dark:bg-zinc-950`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <Stars
                      rating={testimonial.rating}
                      size={hero ? "h-4 w-4" : "h-3.5 w-3.5"}
                      label={`${testimonial.rating} trên 5 sao`}
                    />
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                      <FiMessageSquare aria-hidden="true" className="h-4 w-4" />
                    </span>
                  </div>
                  <blockquote
                    className={`mt-3 text-balance text-zinc-700 dark:text-zinc-300 ${
                      hero ? "text-base font-medium sm:text-lg" : "text-sm"
                    }`}
                  >
                    “{testimonial.quote}”
                  </blockquote>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {testimonial.customerName}
                  </span>
                  <span className="rounded-full border border-zinc-200 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
                    {testimonial.serviceLabel}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
