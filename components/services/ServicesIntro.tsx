"use client";

import { useRef } from "react";
import { MaskLines } from "@/components/home/MaskLines";
import { TourButton } from "@/components/tour/TourButton";
import { useChapterMotion } from "@/hooks/useChapterMotion";

type ServicesIntroProps = {
  live: boolean;
  countText: string;
};

// Header chapter of the services list, laid out like the products intro:
// eyebrow, masked headline, one line of copy and the guide button, then the
// realtime status and the service count on a hairline.
export function ServicesIntro({ live, countText }: ServicesIntroProps) {
  const rootRef = useRef<HTMLElement>(null);
  useChapterMotion(rootRef);

  return (
    <section
      ref={rootRef}
      aria-label="Đặt lịch dịch vụ"
      className="mx-auto max-w-7xl w-full px-4 pt-8 sm:px-6 md:pt-10 lg:px-8"
    >
      <p className="text-xs font-semibold tracking-wide text-[#111111] uppercase dark:text-zinc-400">
        Dịch vụ
      </p>
      <MaskLines
        as="h1"
        lines={["Chọn dịch vụ,", "thợ tới nơi."]}
        className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl dark:text-zinc-50"
      />
      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <p
          data-chapter-row
          className="max-w-xl text-sm leading-relaxed text-zinc-800 md:text-base dark:text-zinc-400"
        >
          Giá trọn gói báo trước. Chọn một hoặc nhiều dịch vụ rồi đặt lịch một
          lần.
        </p>
        <div className="w-fit">
          <TourButton
            tour="customer-guide"
            ariaLabel="Mở sổ tay hướng dẫn đặt lịch"
            label="Sổ tay hướng dẫn"
          />
        </div>
      </div>
      <span
        data-rule
        aria-hidden="true"
        className="mt-6 block h-px origin-left bg-zinc-200 md:mt-8 dark:bg-zinc-800"
      />
      <div className="flex flex-wrap items-center justify-between gap-2 py-3">
        <output
          aria-label={live ? "Realtime đang hoạt động" : "Realtime mất kết nối"}
          className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400"
        >
          <span
            aria-hidden="true"
            className={`h-2 w-2 rounded-full ${
              live
                ? "bg-green-600 dark:bg-green-400"
                : "border border-zinc-400 dark:border-zinc-500"
            }`}
          />
          {live ? "Giá cập nhật trực tiếp" : "Đang nối lại giá trực tiếp…"}
        </output>
        <p
          aria-live="polite"
          className="text-xs text-zinc-600 dark:text-zinc-400"
        >
          {countText}
        </p>
      </div>
    </section>
  );
}
