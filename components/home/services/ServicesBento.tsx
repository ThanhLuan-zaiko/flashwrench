"use client";

import { FiSettings, FiZap } from "react-icons/fi";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { BookingWideCard } from "./BookingWideCard";
import { PriceWideCard } from "./PriceWideCard";
import { RescueHeroCard } from "./RescueHeroCard";
import { ServiceMiniCard } from "./ServiceMiniCard";

// Grid root only: layout plus reveal scope. Cards own their content.
export function ServicesBento() {
  const rootRef = useBentoReveal<HTMLElement>();

  return (
    <section
      ref={rootRef}
      id="dich-vu"
      aria-label="Dịch vụ FlashWrench"
      className="scroll-mt-20"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 md:py-14">
        <div data-reveal className="max-w-2xl">
          <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            Dịch vụ
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance text-zinc-900 sm:text-4xl dark:text-zinc-50">
            Mọi bệnh của xe, một nơi chữa.
          </h2>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
          <RescueHeroCard />
          <ServiceMiniCard
            title="Bảo dưỡng tại nhà"
            hint="Thay dầu, lọc gió, kiểm tra tổng quát."
            icon={FiSettings}
          />
          <ServiceMiniCard
            title="Sửa chữa lưu động"
            hint="Phanh, ắc quy, lốp, điện lạnh."
            icon={FiZap}
          />
          <PriceWideCard />
          <BookingWideCard />
        </div>
      </div>
    </section>
  );
}
