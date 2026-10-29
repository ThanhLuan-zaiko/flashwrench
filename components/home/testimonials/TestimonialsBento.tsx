"use client";

import { useBentoReveal } from "@/hooks/useBentoReveal";
import type { LandingReview } from "@/lib/home/landing-reviews.service";
import { RealReviewCard } from "./RealReviewCard";

// Customer quote wall built only from real, visible reviews fetched
// server-side. With no qualifying review yet the whole section stays out of
// the page instead of showing invented quotes.
export function TestimonialsBento({
  realItems,
}: {
  realItems: LandingReview[];
}) {
  const rootRef = useBentoReveal<HTMLElement>();
  if (realItems.length === 0) return null;

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
        <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
          {realItems.map((review) => (
            <RealReviewCard key={review.id} review={review} />
          ))}
        </ul>
      </div>
    </section>
  );
}
