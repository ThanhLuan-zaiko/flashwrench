"use client";

import Image from "next/image";
import { useRef } from "react";
import { useChapterMotion } from "@/hooks/useChapterMotion";
import { MaskLines } from "../MaskLines";

type Stop = {
  numeral: string;
  title: string;
  hint: string;
  illustration: string;
};

const STOPS: Stop[] = [
  {
    numeral: "01",
    title: "Mô tả sự cố",
    hint: "Chọn dịch vụ, nhập vị trí và ảnh xe nếu có.",
    illustration: "/images/isometric/wrench.svg",
  },
  {
    numeral: "02",
    title: "Nhận giá cố định",
    hint: "Báo giá rõ ràng trước khi xác nhận.",
    illustration: "/images/isometric/toolbox.svg",
  },
  {
    numeral: "03",
    title: "Theo dõi thợ",
    hint: "Xem thợ đang đến trên bản đồ theo thời gian thực.",
    illustration: "/images/isometric/tyre.svg",
  },
  {
    numeral: "04",
    title: "Xong việc, thanh toán",
    hint: "Thanh toán sau khi bạn hài lòng.",
    illustration: "/images/isometric/gear.svg",
  },
];

// Process chapter: four steps in a row, each under its own drawn rule with a
// large flat isometric illustration, a numeral and one line of copy. Phones
// get a 2x2 grid so each hint keeps a readable line length.
export function StepsBento() {
  const rootRef = useRef<HTMLElement>(null);
  useChapterMotion(rootRef);

  return (
    <section ref={rootRef} aria-label="Quy trình">
      <div className="w-full px-4 pb-16 sm:px-6 md:pb-24 lg:px-10">
        <p className="text-xs font-semibold tracking-wide text-[#1E3A5F] uppercase dark:text-zinc-400">
          Quy trình
        </p>
        <MaskLines
          lines={["Bốn bước,", "không cần đến garage"]}
          className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 md:text-5xl dark:text-zinc-50"
        />
        <ol
          data-tour="how-it-works"
          className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-4 sm:gap-x-8 md:mt-12"
        >
          {STOPS.map((stop) => (
            <li key={stop.numeral} className="min-w-0">
              <span
                data-rule
                aria-hidden="true"
                className="block h-px origin-left bg-zinc-300 dark:bg-zinc-700"
              />
              <div data-chapter-row>
                <p className="mt-4 text-sm font-semibold text-zinc-500 tabular-nums dark:text-zinc-400">
                  {stop.numeral}
                </p>
                <Image
                  src={stop.illustration}
                  alt=""
                  width={160}
                  height={160}
                  className="mt-3 h-24 w-24 md:h-36 md:w-36"
                />
                <h3 className="mt-4 text-base font-bold tracking-tight text-zinc-900 md:text-xl dark:text-zinc-50">
                  {stop.title}
                </h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {stop.hint}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
