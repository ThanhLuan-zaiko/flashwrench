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

// How-it-works: three numbered steps side by side on md and up, then a
// navy closing card that carries the sign-up action.
export function StepsBento() {
  const rootRef = useBentoReveal<HTMLElement>();

  return (
    <section ref={rootRef} aria-label="Cách hoạt động">
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 md:pb-24">
        <div data-reveal className="max-w-2xl">
          <p className="text-xs font-semibold tracking-wide text-[#1E3A5F] uppercase dark:text-zinc-400">
            Cách hoạt động
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance text-zinc-900 sm:text-4xl dark:text-zinc-50">
            Ba bước, xe lại lăn bánh.
          </h2>
        </div>
        <div
          data-tour="how-it-works"
          className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4"
        >
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <section
                key={step.numeral}
                aria-label={step.title}
                data-reveal
                className="relative flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 md:p-6 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1E3A5F] text-sm font-bold text-white"
                  >
                    {step.numeral}
                  </span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {step.hint}
                  </p>
                </div>
              </section>
            );
          })}
        </div>
        <section
          aria-label="Bắt đầu miễn phí"
          data-reveal
          className="mt-3 flex flex-col gap-5 rounded-2xl bg-[#1E3A5F] p-5 text-white md:mt-4 md:flex-row md:items-center md:justify-between md:p-7"
        >
          <div>
            <p className="text-sm font-semibold tracking-wide text-zinc-200 uppercase">
              Miễn phí đăng ký
            </p>
            <h3 className="mt-2 text-xl font-bold tracking-tight text-white sm:text-2xl">
              Sẵn sàng lăn bánh?
            </h3>
            <p className="mt-1 text-sm text-zinc-200">
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
            className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#1E3A5F] transition-colors duration-200 hover:bg-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E3A5F] motion-safe:active:scale-[0.99] md:w-auto"
          />
        </section>
      </div>
    </section>
  );
}
