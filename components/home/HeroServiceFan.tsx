"use client";

import Link from "next/link";
import {
  formatVnd,
  PRICE_UNIT_LABELS,
} from "@/app/admin/components/services/catalog-format";
import { usePromoCarousel } from "@/hooks/usePromoCarousel";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";

// Visible card slots, front first. Slot 0 is the largest card in front, slot 1
// sits behind it on the upper right and slot 2 behind on the left. Positions
// are percentages of the fan box so the stack scales with its column. Phones
// use the base classes, from lg up the lg: classes.
const FAN_SLOTS = [
  "z-30 left-[3%] top-[25%] w-[76%] -rotate-[1.5deg] lg:left-[13%] lg:top-[30%] lg:w-[75%]",
  "z-20 right-0 top-0 w-[58%] rotate-[5deg] lg:right-auto lg:left-[25%] lg:top-[7%] lg:w-[57%]",
  "z-10 left-0 top-[10%] w-[50%] -rotate-[7deg] lg:top-[25%] lg:w-[48%]",
];

// Cards past the visible slots wait behind the stack and move into a slot as
// the carousel advances.
const HIDDEN_SLOT =
  "z-0 opacity-0 pointer-events-none left-[25%] top-[25%] w-[48%]";

const BAR_BASE =
  "block h-[3px] w-full rounded-full transition-colors duration-300 group-focus-visible:ring-2 group-focus-visible:ring-white lg:h-1";

type SegmentBarsProps = {
  services: ServiceItem[];
  index: number;
  onSelect: (index: number) => void;
};

// One clickable segment per service, the active one solid white.
function SegmentBars({ services, index, onSelect }: SegmentBarsProps) {
  return (
    <div className="flex gap-1.5 lg:gap-2.5">
      {services.map((service, i) => (
        <button
          key={service.id}
          type="button"
          aria-label={`Chọn ${service.name}`}
          aria-current={i === index}
          onClick={() => onSelect(i)}
          className="group flex h-11 flex-1 items-center focus:outline-none"
        >
          <span
            className={`${BAR_BASE} ${i === index ? "bg-white" : "bg-white/35 group-hover:bg-white/60"}`}
          />
        </button>
      ))}
    </div>
  );
}

// Print-style service cards fanned over the navy hero, the same layered
// treatment as the auth showcase. With more than three services the stack
// rotates on the shared carousel timer, which pauses on hover and focus and
// stays still for reduced-motion users. Each card links to its service page.
export function HeroServiceFan({ services }: { services: ServiceItem[] }) {
  const { index, go, pauseHandlers } = usePromoCarousel(services.length);
  const count = services.length;

  return (
    <div
      {...pauseHandlers}
      className="mx-auto flex w-full max-w-[360px] flex-col gap-4 sm:max-w-[460px] lg:max-w-[456px]"
    >
      <div className="relative h-[420px] sm:h-[560px] lg:h-[520px]">
        {services.map((service, i) => {
          const slot = (i - index + count) % count;
          const visible = slot < FAN_SLOTS.length;
          return (
            <Link
              key={service.id}
              href={`/services/${encodeURIComponent(service.slug)}`}
              aria-label={`Xem dịch vụ ${service.name}`}
              inert={!visible}
              className={`absolute block rounded-xl bg-white p-3 text-[#0F1E33] focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-out sm:p-3.5 ${visible ? `${FAN_SLOTS[slot]} motion-safe:hover:z-40 motion-safe:hover:-translate-y-1` : HIDDEN_SLOT}`}
            >
              {/* biome-ignore lint/performance/noImgElement: dynamic catalog cover served immutable; next/image optimizer hop needs sharp for zero benefit. */}
              <img
                src={service.imageUrl}
                alt=""
                className="aspect-[4/3] w-full rounded-md object-cover"
              />
              <span className="block px-1 pt-3 pb-1">
                <span className="block truncate text-base font-extrabold tracking-tight sm:text-lg xl:text-xl">
                  {service.name}
                </span>
                <span className="mt-1 block text-xs text-zinc-600 sm:text-sm">
                  từ{" "}
                  <span className="font-bold text-[#0F1E33]">
                    {formatVnd(service.basePrice)}
                  </span>{" "}
                  {PRICE_UNIT_LABELS[service.priceUnit]}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
      {count > 1 ? (
        <SegmentBars services={services} index={index} onSelect={go} />
      ) : null}
    </div>
  );
}
