import { FiTool } from "react-icons/fi";
import {
  formatDuration,
  formatVnd,
} from "@/app/admin/components/services/catalog-format";
import { BOOKING_DEFAULT_DURATION_MIN } from "@/lib/booking/booking-services.constants";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";

type BookingSelectedMiniProps = {
  services: readonly ServiceItem[];
};

// Phone recap at the top of the "Vị trí và thời gian" step: the chosen
// services as compact rows with cover, category, duration and price.
export function BookingSelectedCard({ services }: BookingSelectedMiniProps) {
  if (services.length === 0) return null;
  return (
    <section aria-label="Dịch vụ đã chọn" className="flex flex-col gap-2">
      <p className="text-[11px] font-semibold tracking-[0.14em] text-[#1E3A5F] uppercase dark:text-zinc-400">
        Dịch vụ đã chọn
      </p>
      <ul className="flex flex-col divide-y divide-zinc-200 rounded-2xl border border-zinc-200 px-3 dark:divide-zinc-800 dark:border-zinc-800">
        {services.map((service) => (
          <li key={service.id} className="flex items-center gap-3 py-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-100 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600">
              {service.imageUrl ? (
                // biome-ignore lint/performance/noImgElement: catalog cover served immutable from the media store.
                <img
                  src={service.imageUrl}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <FiTool aria-hidden="true" className="h-5 w-5" />
              )}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">
                {service.name}
              </span>
              <span className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                {service.categoryName} · khoảng{" "}
                {formatDuration(
                  service.durationMin ?? BOOKING_DEFAULT_DURATION_MIN,
                )}
              </span>
            </span>
            <span className="shrink-0 text-sm font-extrabold text-zinc-900 dark:text-zinc-50">
              {formatVnd(service.basePrice)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

type BookingRunningTotalProps = {
  services: readonly ServiceItem[];
  subtotal: number;
};

// Phone-only running subtotal shown before the final summary step.
export function BookingRunningTotal({
  services,
  subtotal,
}: BookingRunningTotalProps) {
  if (services.length === 0) return null;
  return (
    <section
      aria-label="Tạm tính"
      className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      {services.map((service) => (
        <p
          key={service.id}
          className="flex items-baseline justify-between gap-3 text-[13px] text-zinc-600 dark:text-zinc-400"
        >
          <span className="min-w-0 truncate">{service.name}</span>
          <span className="shrink-0 font-semibold text-zinc-900 dark:text-zinc-100">
            {formatVnd(service.basePrice)}
          </span>
        </p>
      ))}
      <p className="flex items-baseline justify-between gap-3 border-t border-dashed border-zinc-400 pt-2.5 dark:border-zinc-600">
        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
          Tạm tính
        </span>
        <span className="text-2xl font-extrabold tracking-tight text-[#1E3A5F] dark:text-zinc-50">
          {formatVnd(subtotal)}
        </span>
      </p>
    </section>
  );
}
