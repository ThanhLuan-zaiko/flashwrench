"use client";

import { useRef } from "react";
import { useChapterMotion } from "@/hooks/useChapterMotion";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";
import { MaskLines } from "../MaskLines";
import { BookingRow } from "./BookingRow";
import { HomeServiceCard } from "./HomeServiceCard";
import { RescueRow } from "./RescueRow";

// Services chapter: catalog services as a card grid. Rescue and the booking
// entry stay as ruled rows around it, since they are not catalog items.
export function ServicesBento({ services }: { services: ServiceItem[] }) {
  const rootRef = useRef<HTMLElement>(null);
  useChapterMotion(rootRef);

  return (
    <section
      ref={rootRef}
      id="services"
      aria-label="Dịch vụ FlashWrench"
      className="scroll-mt-20"
    >
      <div className="mx-auto max-w-7xl w-full px-4 py-12 sm:px-6 md:py-12 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-10">
          <div>
            <p className="text-xs font-semibold tracking-wide text-[#111111] uppercase dark:text-zinc-400">
              Dịch vụ
            </p>
            <MaskLines
              lines={["Sửa xe tại nhà,", "tại xưởng và giữa đường"]}
              className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl dark:text-zinc-50"
            />
          </div>
          <p className="max-w-sm text-base text-zinc-800 dark:text-zinc-400">
            Từ bảo dưỡng định kỳ đến cứu hộ, thợ tới tận nơi và báo giá trước
            khi làm.
          </p>
        </div>
        <ul
          data-tour="services"
          className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mt-10 md:gap-6 lg:grid-cols-4"
        >
          {services.map((service) => (
            <HomeServiceCard key={service.id} service={service} />
          ))}
        </ul>
        <ul className="mt-6 md:mt-8">
          <RescueRow />
          <BookingRow />
        </ul>
      </div>
    </section>
  );
}
