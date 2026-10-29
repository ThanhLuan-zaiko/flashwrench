"use client";

import { SmartCtaLink } from "@/components/auth/SmartCtaLink";
import { useBentoReveal } from "@/hooks/useBentoReveal";

type Stop = {
  numeral: string;
  title: string;
  hint: string;
};

const STOPS: Stop[] = [
  {
    numeral: "1",
    title: "Mô tả sự cố",
    hint: "Chọn dịch vụ, nhập vị trí và ảnh xe nếu có.",
  },
  {
    numeral: "2",
    title: "Nhận giá cố định",
    hint: "Báo giá rõ ràng trước khi xác nhận.",
  },
  {
    numeral: "3",
    title: "Theo dõi thợ",
    hint: "Xem thợ đang đến trên bản đồ theo thời gian thực.",
  },
  {
    numeral: "4",
    title: "Xong việc, thanh toán",
    hint: "Thanh toán sau khi bạn hài lòng.",
  },
];

// Route-style process: four numbered stops on one horizontal line at every
// width, so the sequence reads left to right even on a phone. The closing
// navy card carries the sign-up action.
export function StepsBento() {
  const rootRef = useBentoReveal<HTMLElement>();

  return (
    <section ref={rootRef} aria-label="Quy trình">
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 md:pb-24">
        <div data-reveal className="max-w-2xl">
          <p className="text-xs font-semibold tracking-wide text-[#1E3A5F] uppercase dark:text-zinc-400">
            Quy trình
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance text-zinc-900 sm:text-4xl dark:text-zinc-50">
            Bốn bước, không cần đến garage.
          </h2>
        </div>
        <ol
          data-tour="how-it-works"
          className="relative mt-8 grid grid-cols-4 gap-2 sm:gap-4"
        >
          <span
            aria-hidden="true"
            className="absolute top-[15px] left-4 h-0.5 w-[calc(100%-2rem)] bg-[#1E3A5F] sm:top-[17px]"
          />
          {STOPS.map((stop) => (
            <li key={stop.numeral} data-reveal className="relative min-w-0">
              <span
                aria-hidden="true"
                className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#1E3A5F] text-sm font-bold text-white sm:h-9 sm:w-9"
              >
                {stop.numeral}
              </span>
              <h3 className="mt-5 text-sm font-semibold text-zinc-900 sm:text-lg dark:text-zinc-50">
                {stop.title}
              </h3>
              <p className="mt-1 text-xs text-zinc-500 sm:text-sm dark:text-zinc-400">
                {stop.hint}
              </p>
            </li>
          ))}
        </ol>
        <section
          aria-label="Bắt đầu miễn phí"
          data-reveal
          className="mt-12 flex flex-col gap-5 rounded-2xl bg-[#1E3A5F] p-5 text-white md:flex-row md:items-center md:justify-between md:p-7"
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
            guestLabel="Đăng ký ngay"
            authedLabel="Đặt lịch ngay"
            guestAriaLabel="Đăng ký ngay"
            authedAriaLabel="Đặt lịch ngay"
            className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#1E3A5F] transition-colors duration-200 hover:bg-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E3A5F] motion-safe:active:scale-[0.99] md:w-auto"
          />
        </section>
      </div>
    </section>
  );
}
