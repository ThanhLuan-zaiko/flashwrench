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

// Process chapter: four step cards, each with a flat isometric illustration,
// a numeral, a title and one line of copy. Phones get a single column, tablets
// two, desktop four.
export function StepsBento() {
  const rootRef = useRef<HTMLElement>(null);
  useChapterMotion(rootRef);

  return (
    <section ref={rootRef} aria-label="Quy trình">
      <div className="mx-auto max-w-7xl w-full px-4 pb-16 sm:px-6 md:pb-16 lg:px-8">
        <p className="text-xs font-semibold tracking-wide text-[#111111] uppercase dark:text-zinc-400">
          Quy trình
        </p>
        <MaskLines
          lines={["Bốn bước,", "không cần đến garage"]}
          className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl dark:text-zinc-50"
        />
        <ol
          data-tour="how-it-works"
          className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mt-12 md:gap-6 lg:grid-cols-4"
        >
          {STOPS.map((stop) => (
            <li
              key={stop.numeral}
              data-chapter-row
              className="flex min-w-0 flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 md:p-6 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-zinc-600 tabular-nums dark:text-zinc-400">
                  {stop.numeral}
                </p>
                <Image
                  src={stop.illustration}
                  alt=""
                  width={160}
                  height={160}
                  className="h-16 w-16 md:h-20 md:w-20"
                />
              </div>
              <h3 className="mt-auto border-t border-zinc-200 pt-4 text-base font-bold tracking-tight text-zinc-900 md:text-lg dark:border-zinc-800 dark:text-zinc-50">
                {stop.title}
              </h3>
              <p className="text-sm text-zinc-800 dark:text-zinc-400">
                {stop.hint}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
