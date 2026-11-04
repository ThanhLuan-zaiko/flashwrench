"use client";

import { useRef } from "react";
import { useChapterMotion } from "@/hooks/useChapterMotion";
import type { LandingReview } from "@/lib/home/landing-reviews.service";
import { MarqueeTrack } from "../MarqueeTrack";
import { MaskLines } from "../MaskLines";
import { shouldDrift } from "../marquee-items";
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
      <div className="mx-auto max-w-7xl w-full px-4 pb-12 sm:px-6 md:pb-12 lg:px-8">
        <p className="text-xs font-semibold tracking-wide text-zinc-600 uppercase dark:text-zinc-400">
          Khách hàng nói gì
        </p>
        <MaskLines
          lines={["Đánh giá thật", "từ từng chuyến xe"]}
          className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl dark:text-zinc-50"
        />
        <p className="mt-3 max-w-xl text-base text-zinc-800 dark:text-zinc-400">
          Đánh giá từ người dùng dịch vụ sửa xe lưu động, cứu hộ và mua phụ tùng
          trên FlashWrench.
        </p>
        {shouldDrift(realItems.length) ? (
          <DriftingReviews items={realItems} />
        ) : (
          <ul
            aria-label="Đánh giá từ khách hàng"
            className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mt-10 md:gap-6 lg:grid-cols-3"
          >
            {realItems.map((review) => (
              <RealReviewCard
                key={review.id}
                review={review}
                className="flex"
              />
            ))}
          </ul>
        )}
        <span
          data-rule
          aria-hidden="true"
          className="block h-px origin-left bg-zinc-200 dark:bg-zinc-800"
        />
      </div>
    </section>
  );
}

// Two marquee rows, the second reversed and decorative.
function DriftingReviews({ items }: { items: LandingReview[] }) {
  return (
    <>
      <span
        data-rule
        aria-hidden="true"
        className="mt-8 block h-px origin-left bg-zinc-200 md:mt-10 dark:bg-zinc-800"
      />
      <div className="flex flex-col gap-8 py-6 md:py-8">
        <MarqueeTrack
          items={items}
          label="Đánh giá từ khách hàng"
          renderItem={(review) => (
            <RealReviewCard
              review={review}
              className="w-80 shrink-0 pr-10 md:w-[28rem]"
            />
          )}
        />
        <MarqueeTrack
          items={[...items].reverse()}
          label="Đánh giá từ khách hàng, cuộn ngược"
          direction="right"
          decorative
          renderItem={(review) => (
            <RealReviewCard
              review={review}
              className="w-80 shrink-0 pr-10 md:w-[28rem]"
            />
          )}
        />
      </div>
    </>
  );
}
