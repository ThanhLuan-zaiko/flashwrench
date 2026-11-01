"use client";

import { useRef } from "react";
import { MaskLines } from "@/components/home/MaskLines";
import { useChapterMotion } from "@/hooks/useChapterMotion";
import { ServicesAccountCta } from "./ServicesAccountCta";

// Closing chapter of the services list: one statement on the page surface and
// the account or booking link, as a text action. The selection bar keeps the
// screen's single orange action.
export function ServicesClosingCta() {
  const rootRef = useRef<HTMLElement>(null);
  useChapterMotion(rootRef);

  return (
    <section
      ref={rootRef}
      aria-label="Tạo tài khoản để lưu lịch hẹn"
      className="w-full px-4 pt-6 pb-16 sm:px-6 md:pt-10 md:pb-16 lg:px-10"
    >
      <span
        data-rule
        aria-hidden="true"
        className="block h-px origin-left bg-zinc-200 dark:bg-zinc-800"
      />
      <div className="grid grid-cols-1 gap-8 pt-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-16 md:pt-12">
        <div data-chapter-row>
          <MaskLines
            lines={["Đã chọn được dịch vụ ưng ý?"]}
            className="text-2xl font-bold tracking-tight text-zinc-900 md:text-4xl dark:text-zinc-50"
          />
          <p className="mt-4 max-w-xl text-base text-zinc-600 md:text-lg dark:text-zinc-400">
            Đặt nhanh một dịch vụ hoặc thêm nhiều dịch vụ vào cùng lịch hẹn. Tạo
            tài khoản nếu bạn muốn lưu lịch sử và dùng voucher.
          </p>
        </div>
        <div data-chapter-row>
          <ServicesAccountCta />
        </div>
      </div>
    </section>
  );
}
