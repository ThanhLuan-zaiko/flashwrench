"use client";

import { useRef, useState } from "react";
import { useChapterMotion } from "@/hooks/useChapterMotion";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";
import { MaskLines } from "../MaskLines";
import { BookingRow } from "./BookingRow";
import { HomeServiceRow } from "./HomeServiceRow";
import { RescueRow } from "./RescueRow";
import { toggleOpenService } from "./service-accordion";

// Services chapter: a ruled accordion on the page surface instead of a card
// grid. Rescue opens the list, the catalog services follow and the booking
// entry closes it. The first service starts open so a photo shows at once.
export function ServicesBento({ services }: { services: ServiceItem[] }) {
  const rootRef = useRef<HTMLElement>(null);
  const [openId, setOpenId] = useState<string | null>(services[0]?.id ?? null);
  useChapterMotion(rootRef);

  return (
    <section
      ref={rootRef}
      id="services"
      aria-label="Dịch vụ FlashWrench"
      className="scroll-mt-20"
    >
      <div className="w-full px-4 py-12 sm:px-6 md:py-12 lg:px-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-10">
          <div>
            <p className="text-xs font-semibold tracking-wide text-[#1E3A5F] uppercase dark:text-zinc-400">
              Dịch vụ
            </p>
            <MaskLines
              lines={["Sửa xe tại nhà,", "tại xưởng và giữa đường"]}
              className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 md:text-4xl dark:text-zinc-50"
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
            <HomeServiceRow
              key={service.id}
              service={service}
              index={index}
              open={service.id === openId}
              onToggle={() =>
                setOpenId((current) => toggleOpenService(current, service.id))
              }
            />
          ))}
          <BookingRow />
        </ol>
      </div>
    </section>
  );
}
