"use client";

import { useRef } from "react";
import { MaskLines } from "@/components/home/MaskLines";
import { TourButton } from "@/components/tour/TourButton";
import { useChapterMotion } from "@/hooks/useChapterMotion";

type VouchersIntroProps = {
  countText: string;
};

// Header chapter of the voucher wallet, laid out like the products intro:
// eyebrow, masked headline, one line of copy and the guide button, then the
// voucher count on a hairline.
export function VouchersIntro({ countText }: VouchersIntroProps) {
  const rootRef = useRef<HTMLElement>(null);
  useChapterMotion(rootRef);

  return (
    <section
      ref={rootRef}
      aria-label="Ví voucher"
      data-tour="vouchers-header"
      className="mx-auto max-w-7xl w-full px-4 pt-8 sm:px-6 md:pt-10 lg:px-8"
    >
      <p className="text-xs font-semibold tracking-wide text-[#1E3A5F] uppercase dark:text-zinc-400">
        Ví voucher
      </p>
      <MaskLines
        as="h1"
        lines={["Voucher của bạn,", "dùng trên tài khoản này."]}
        className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl dark:text-zinc-50"
      />
      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <p
          data-chapter-row
          className="max-w-xl text-sm leading-relaxed text-zinc-600 md:text-base dark:text-zinc-400"
        >
          Mỗi voucher chỉ dùng được trên tài khoản này, tự cập nhật khi có
          voucher mới.
        </p>
        <div className="w-fit">
          <TourButton
            tour="vouchers-guide"
            ariaLabel="Mở sổ tay hướng dẫn ví voucher"
            label="Sổ tay hướng dẫn"
          />
        </div>
      </div>
      <span
        data-rule
        aria-hidden="true"
        className="mt-6 block h-px origin-left bg-zinc-200 md:mt-8 dark:bg-zinc-800"
      />
      <div className="flex justify-end py-3">
        <p
          aria-live="polite"
          className="text-xs text-zinc-500 dark:text-zinc-400"
        >
          {countText}
        </p>
      </div>
    </section>
  );
}
