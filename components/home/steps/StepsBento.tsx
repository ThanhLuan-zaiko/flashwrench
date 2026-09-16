"use client";

import type { IconType } from "react-icons";
import { FiArrowRight, FiCalendar, FiMapPin, FiTool } from "react-icons/fi";
import { SmartCtaLink } from "@/components/auth/SmartCtaLink";
import { useBentoReveal } from "@/hooks/useBentoReveal";

type Step = {
  numeral: string;
  title: string;
  hint: string;
  icon: IconType;
};

const STEPS: Step[] = [
  {
    numeral: "01",
    title: "Đặt lịch",
    hint: "Chọn dịch vụ, khung giờ và địa điểm của bạn.",
    icon: FiCalendar,
  },
  {
    numeral: "02",
    title: "Thợ tới tận nơi",
    hint: "Thợ xác thực đến đúng hẹn với đầy đủ đồ nghề.",
    icon: FiMapPin,
  },
  {
    numeral: "03",
    title: "Sửa và bàn giao",
    hint: "Nghiệm thu tại chỗ rồi mới thanh toán.",
    icon: FiTool,
  },
];

// How-it-works grid. Giant numerals carry the hierarchy,
// monochrome surfaces throughout.
export function StepsBento() {
  const rootRef = useBentoReveal<HTMLElement>();

  return (
    <section ref={rootRef} aria-label="Cách hoạt động">
      <div className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6 md:pb-20">
        <div data-reveal className="max-w-2xl">
          <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            Cách hoạt động
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance text-zinc-900 sm:text-4xl dark:text-zinc-50">
            Ba bước, xe lại lăn bánh.
          </h2>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <section
                key={step.numeral}
                aria-label={step.title}
                data-reveal
                className="rounded-2xl border border-zinc-200 bg-white p-4 md:p-5 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <p className="flex items-start justify-between gap-2">
                  <span className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {step.numeral}
                  </span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                </p>
                <h3 className="mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {step.title}
                </h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {step.hint}
                </p>
              </section>
            );
          })}
          <section
            aria-label="Bắt đầu miễn phí"
            data-reveal
            className="flex flex-col justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4 md:p-5 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div>
              <p className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
                Miễn phí
              </p>
              <h3 className="mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Sẵn sàng lăn bánh?
              </h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Tham gia miễn phí, đặt lịch khi cần.
              </p>
            </div>
            <SmartCtaLink
              guestHref="/register"
              authedHref="/booking"
              guestLabel={
                <>
                  Đăng ký ngay
                  <FiArrowRight aria-hidden="true" className="h-4 w-4" />
                </>
              }
              authedLabel={
                <>
                  Đặt lịch ngay
                  <FiArrowRight aria-hidden="true" className="h-4 w-4" />
                </>
              }
              guestAriaLabel="Đăng ký ngay"
              authedAriaLabel="Đặt lịch ngay"
              className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-950"
            />
          </section>
        </div>
      </div>
    </section>
  );
}
