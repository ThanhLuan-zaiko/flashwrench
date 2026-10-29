"use client";

import { useBentoReveal } from "@/hooks/useBentoReveal";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";
import { BookingWideCard } from "./BookingWideCard";
import { HomeServiceCard } from "./HomeServiceCard";
import { RescueHeroCard } from "./RescueHeroCard";

// Six cells on lg: rescue hero 2x2 on the left, up to four real catalog
// services on the right, then the full-width booking card. Prices live in
// the receipt section below. Phones get one column per pair so photos stay
// large.
export function ServicesBento({ services }: { services: ServiceItem[] }) {
  const rootRef = useBentoReveal<HTMLElement>();

  return (
    <section
      ref={rootRef}
      id="dich-vu"
      aria-label="Dịch vụ FlashWrench"
      className="scroll-mt-20"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 md:py-20">
        <div data-reveal className="max-w-2xl">
          <p className="text-xs font-semibold tracking-wide text-[#1E3A5F] uppercase dark:text-zinc-400">
            Dịch vụ
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance text-zinc-900 sm:text-4xl dark:text-zinc-50">
            Một cuộc gọi, mọi việc xe cần.
          </h2>
          <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400">
            Từ bảo dưỡng định kỳ đến cứu hộ giữa đường, thợ tới tận nơi và báo
            giá trước khi làm.
          </p>
        </div>
        <div
          data-tour="services"
          className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4"
        >
          <RescueHeroCard />
          {services.map((service) => (
            <HomeServiceCard key={service.id} service={service} />
          ))}
          <BookingWideCard />
        </div>
      </div>
    </section>
  );
}
