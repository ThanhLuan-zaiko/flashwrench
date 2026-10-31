"use client";

import Image from "next/image";
import { SmartCtaLink } from "@/components/auth/SmartCtaLink";
import { useBentoReveal } from "@/hooks/useBentoReveal";

type Stop = {
  numeral: string;
  title: string;
  hint: string;
  illustration: string;
};

const STOPS: Stop[] = [
  {
    numeral: "1",
    title: "Mô tả sự cố",
    hint: "Chọn dịch vụ, nhập vị trí và ảnh xe nếu có.",
    illustration: "/images/isometric/wrench.svg",
  },
  {
    numeral: "2",
    title: "Nhận giá cố định",
    hint: "Báo giá rõ ràng trước khi xác nhận.",
    illustration: "/images/isometric/toolbox.svg",
  },
  {
    numeral: "3",
    title: "Theo dõi thợ",
    hint: "Xem thợ đang đến trên bản đồ theo thời gian thực.",
    illustration: "/images/isometric/tyre.svg",
  },
  {
    numeral: "4",
    title: "Xong việc, thanh toán",
    hint: "Thanh toán sau khi bạn hài lòng.",
    illustration: "/images/isometric/gear.svg",
  },
];

// Route-style process: four numbered stops, each topped with a flat isometric
// illustration. Phones get a 2x2 grid so each hint keeps a readable line
// length; from `sm` up the stops sit on one horizontal route line that runs
// through the numerals (illustration 96px + 16px gap + half of the 36px badge).
// The closing navy card carries the sign-up action.
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
          className="relative mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 sm:gap-4"
        >
          <span
            aria-hidden="true"
            className="absolute top-[129px] left-4 hidden h-0.5 w-[calc(100%-2rem)] bg-[#1E3A5F] sm:block"
          />
          {STOPS.map((stop) => (
            <li key={stop.numeral} data-reveal className="relative min-w-0">
              <Image
                src={stop.illustration}
                alt=""
                width={96}
                height={96}
                className="h-16 w-16 sm:h-24 sm:w-24"
              />
              <span
                aria-hidden="true"
                className="relative mt-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#1E3A5F] text-sm font-bold text-white sm:mt-4 sm:h-9 sm:w-9"
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
          aria-label="Tạo tài khoản"
          data-reveal
          className="mt-12 flex flex-col gap-5 rounded-2xl bg-[#1E3A5F] p-5 text-white md:flex-row md:items-center md:justify-between md:p-7"
        >
          <div>
            <p className="text-sm font-semibold tracking-wide text-zinc-200 uppercase">
              Đăng ký tài khoản
            </p>
            <h3 className="mt-2 text-xl font-bold tracking-tight text-white sm:text-2xl">
              Đặt lịch sửa xe
            </h3>
            <p className="mt-1 text-sm text-zinc-200">
              Tạo tài khoản để đặt lịch khi cần.
            </p>
          </div>
          <SmartCtaLink
            guestHref="/register"
            authedHref="/booking"
            guestLabel="Đăng ký ngay"
            authedLabel="Đặt lịch ngay"
            guestAriaLabel="Đăng ký ngay"
            authedAriaLabel="Đặt lịch ngay"
            className="inline-flex min-h-[44px] items-center gap-1.5 self-start rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#1E3A5F] transition-colors duration-200 hover:bg-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E3A5F] motion-safe:active:scale-[0.99]"
          />
        </section>
      </div>
    </section>
  );
}
