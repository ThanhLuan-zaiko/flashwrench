"use client";

import { FiBatteryCharging, FiDisc, FiSettings, FiTool } from "react-icons/fi";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { BookingWideCard } from "./BookingWideCard";
import { PriceWideCard } from "./PriceWideCard";
import { RescueHeroCard } from "./RescueHeroCard";
import { ServiceMiniCard } from "./ServiceMiniCard";

// Seven cells on lg: rescue hero 2x2 on the left, four 1x1 services on
// the right, then the price and booking wides on a full bottom row.
export function ServicesBento() {
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
            Mọi bệnh của xe, một nơi chữa.
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
          <ServiceMiniCard
            title="Bảo dưỡng tại nhà"
            hint="Thay dầu, lọc gió, kiểm tra tổng quát."
            icon={FiSettings}
          />
          <ServiceMiniCard
            title="Sửa chữa lưu động"
            hint="Phanh, treo, hệ thống làm mát."
            icon={FiTool}
          />
          <ServiceMiniCard
            title="Thay lốp và cân bằng"
            hint="Lốp mới, vá lốp và cân bằng động tại chỗ."
            icon={FiDisc}
          />
          <ServiceMiniCard
            title="Ắc quy và hệ thống điện"
            hint="Kiểm tra, thay ắc quy và sửa đèn, điện."
            icon={FiBatteryCharging}
          />
          <PriceWideCard />
          <BookingWideCard />
        </div>
      </div>
    </section>
  );
}
