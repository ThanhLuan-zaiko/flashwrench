"use client";

import { useRef } from "react";
import { useChapterMotion } from "@/hooks/useChapterMotion";
import type { LandingReview } from "@/lib/home/landing-reviews.service";
import { MaskLines } from "../MaskLines";
import { RealReviewCard } from "./RealReviewCard";

// Customer quote chapter built only from real, visible reviews fetched
// server-side. With no qualifying review yet the whole section stays out of
// the page instead of showing invented quotes.
export function TestimonialsBento({
  realItems,
}: {
  realItems: LandingReview[];
}) {
  const rootRef = useRef<HTMLElement>(null);
  useChapterMotion(rootRef);
  if (realItems.length === 0) return null;

  return (
    <section ref={rootRef} aria-label="Đánh giá từ khách hàng">
      <div className="w-full px-4 pb-12 sm:px-6 md:pb-20 lg:px-10">
        <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
          Khách hàng nói gì
        </p>
        <MaskLines
          lines={["Đánh giá thật", "từ từng chuyến xe"]}
          className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 md:text-5xl dark:text-zinc-50"
        />
        <p className="mt-3 max-w-xl text-base text-zinc-600 dark:text-zinc-400">
          Đánh giá từ người dùng dịch vụ sửa xe lưu động, cứu hộ và mua phụ tùng
          trên FlashWrench.
        </p>
        <ul className="mt-8 md:mt-10">
          {realItems.map((review) => (
            <RealReviewCard key={review.id} review={review} />
          ))}
          <li>
            <span
              data-rule
              aria-hidden="true"
              className="block h-px origin-left bg-zinc-200 dark:bg-zinc-800"
            />
          </li>
        </ul>
      </div>
    </section>
  );
}
