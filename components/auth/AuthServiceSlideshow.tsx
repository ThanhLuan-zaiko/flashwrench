"use client";

import {
  formatVnd,
  PRICE_UNIT_LABELS,
} from "@/app/admin/components/services/catalog-format";
import { usePromoCarousel } from "@/hooks/usePromoCarousel";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";

// Card slots in the fan, front first. Cards beyond the third wait hidden
// behind the stack and take a slot as the carousel advances.
const FAN_SLOTS = [
  "z-30 top-[10%] left-[10%] w-[min(64%,52svh)] -rotate-[1.5deg]",
  "z-20 top-[3%] left-[18%] w-[min(52%,42svh)] -rotate-5 brightness-90",
  "z-10 top-[6%] left-[40%] w-[min(50%,40svh)] rotate-[7deg] brightness-[0.85]",
  "z-0 top-[6%] left-[30%] w-[min(50%,40svh)] opacity-0",
];

const BAR_BASE =
  "block h-[3px] w-full rounded-full transition-colors duration-300 group-focus-visible:ring-2 group-focus-visible:ring-white lg:h-1";

type SegmentBarsProps = {
  services: ServiceItem[];
  index: number;
  onSelect: (index: number) => void;
  className?: string;
};

// One clickable segment per service, the active one solid white.
function SegmentBars({
  services,
  index,
  onSelect,
  className = "",
}: SegmentBarsProps) {
  if (services.length < 2) return null;
  return (
    <div className={`flex gap-1.5 lg:gap-2.5 ${className}`}>
      {services.map((service, i) => (
        <button
          key={service.id}
          type="button"
          aria-label={`Xem dịch vụ ${service.name}`}
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

// Service showcase for the auth screens, on the shared carousel autoplay
// (pauses on hover and focus). Below lg: a full-bleed photo band that
// cross-fades. From lg: print-style cards fanned on navy, the front card
// is the active service and the others shuffle forward. Motion is
// motion-safe, so reduced-motion users get an instant swap and no autoplay.
export function AuthServiceSlideshow({
  services,
  className = "",
}: {
  services: ServiceItem[];
  className?: string;
}) {
  const { index, go, pauseHandlers } = usePromoCarousel(services.length);
  const count = services.length;

  return (
    <section
      aria-label="Dịch vụ nổi bật của FlashWrench"
      {...pauseHandlers}
      className={`relative overflow-hidden bg-[#1E3A5F] text-white ${className}`}
    >
      <div className="lg:hidden">
        {services.map((service, i) => (
          // biome-ignore lint/performance/noImgElement: dynamic catalog cover served immutable; next/image optimizer hop needs sharp for zero benefit.
          <img
            key={service.id}
            src={service.imageUrl}
            alt=""
            aria-hidden="true"
            className={`absolute inset-0 h-full w-full object-cover motion-safe:transition-opacity motion-safe:duration-300 motion-safe:ease-out ${i === index ? "opacity-100" : "opacity-0"}`}
          />
        ))}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0F1E33]/95 via-[#0F1E33]/60 to-transparent px-5 pt-20 pb-9 sm:px-8 sm:pb-3">
          {services.map((service, i) => (
            <div
              key={service.id}
              aria-hidden={i !== index}
              className={i === index ? "block" : "hidden"}
            >
              <p className="text-[11px] font-bold tracking-[0.14em] text-zinc-200 uppercase">
                {service.categoryName}
              </p>
              <p className="mt-1 text-2xl leading-tight font-extrabold tracking-tight text-balance sm:text-[26px]">
                {service.name}
              </p>
              <p className="mt-1.5 text-sm text-zinc-100">
                từ{" "}
                <span className="text-base font-bold text-white">
                  {formatVnd(service.basePrice)}
                </span>{" "}
                {PRICE_UNIT_LABELS[service.priceUnit]}
              </p>
            </div>
          ))}
          <SegmentBars services={services} index={index} onSelect={go} />
        </div>
      </div>

      {/* Content hugs the top and sticks while a long form scrolls, so the headline never ends up below the fold. */}
      <div className="relative hidden flex-col pt-8 lg:sticky lg:top-0 lg:flex">
        <div className="relative h-[54svh] min-h-[340px]">
          {services.map((service, i) => {
            const slot = (i - index + count) % count;
            const isFront = slot === 0;
            return (
              <figure
                key={service.id}
                aria-hidden={!isFront}
                className={`absolute m-0 rounded-xl bg-white p-3.5 motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out xl:p-4 ${FAN_SLOTS[Math.min(slot, 3)]}`}
              >
                {/* biome-ignore lint/performance/noImgElement: dynamic catalog cover served immutable; next/image optimizer hop needs sharp for zero benefit. */}
                <img
                  src={service.imageUrl}
                  alt=""
                  className="aspect-[3/2] w-full rounded-md object-cover"
                />
                <figcaption
                  className={`flex items-end justify-between gap-4 px-2 pt-4 pb-3 text-[#0F1E33] motion-safe:transition-opacity motion-safe:duration-300 ${isFront ? "opacity-100" : "opacity-0"}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[11px] font-bold tracking-[0.14em] text-zinc-600 uppercase">
                      {service.categoryName}
                    </span>
                    <span className="mt-1 block truncate text-xl leading-tight font-extrabold tracking-tight xl:text-2xl">
                      {service.name}
                    </span>
                  </span>
                  <span className="shrink-0 text-right text-xs text-zinc-600">
                    từ
                    <span className="block text-lg font-extrabold text-[#0F1E33] xl:text-xl">
                      {formatVnd(service.basePrice)}
                    </span>
                  </span>
                </figcaption>
              </figure>
            );
          })}
        </div>

        <p className="relative mt-4 px-12 pb-2 text-3xl leading-[1.12] font-extrabold tracking-tight text-balance xl:px-20 xl:text-4xl">
          Thợ tới tận nơi, giá rõ ràng trước khi làm.
        </p>
        <SegmentBars
          services={services}
          index={index}
          onSelect={go}
          className="relative px-12 pb-3 xl:px-20"
        />
      </div>
    </section>
  );
}
