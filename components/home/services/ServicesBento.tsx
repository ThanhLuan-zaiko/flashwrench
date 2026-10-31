"use client";

import { useRef } from "react";
import { useChapterExtras } from "@/hooks/useChapterExtras";
import { useChapterMotion } from "@/hooks/useChapterMotion";
import { useCursorPreview } from "@/hooks/useCursorPreview";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";
import { MaskLines } from "../MaskLines";
import { BookingRow } from "./BookingRow";
import { HomeServiceRow } from "./HomeServiceRow";
import { RescueRow } from "./RescueRow";
import { ServicePreview } from "./ServicePreview";

// Services chapter: a ruled list on the page surface instead of a card grid.
// Rescue opens the list, up to four catalog services follow and the booking
// entry closes it, so three or four services read in one viewport.
// useChapterMotion lifts the headline, draws the rules and opens the photos;
// useChapterExtras adds photo parallax and title focus; useCursorPreview
// shows a large photo that follows the mouse over a row.
export function ServicesBento({ services }: { services: ServiceItem[] }) {
  const rootRef = useRef<HTMLElement>(null);
  useChapterMotion(rootRef);
  useChapterExtras(rootRef);
  useCursorPreview(rootRef);

  return (
    <section
      ref={rootRef}
      id="services"
      aria-label="Dịch vụ FlashWrench"
      className="scroll-mt-20"
    >
      <div className="w-full px-4 py-12 sm:px-6 md:py-20 lg:px-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-10">
          <div>
            <p className="text-xs font-semibold tracking-wide text-[#1E3A5F] uppercase dark:text-zinc-400">
              Dịch vụ
            </p>
            <MaskLines
              lines={["Sửa xe tại nhà,", "tại xưởng và giữa đường"]}
              className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 md:text-5xl dark:text-zinc-50"
            />
          </div>
          <p className="max-w-sm text-base text-zinc-600 dark:text-zinc-400">
            Từ bảo dưỡng định kỳ đến cứu hộ, thợ tới tận nơi và báo giá trước
            khi làm.
          </p>
        </div>
        <ol data-tour="services" className="mt-8 md:mt-10">
          <RescueRow />
          {services.map((service, index) => (
            <HomeServiceRow key={service.id} service={service} index={index} />
          ))}
          <BookingRow />
        </ol>
        <ServicePreview />
      </div>
    </section>
  );
}
