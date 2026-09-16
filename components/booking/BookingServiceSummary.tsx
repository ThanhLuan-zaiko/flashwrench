import { FiClock, FiHome, FiLifeBuoy } from "react-icons/fi";
import {
  formatDuration,
  formatVnd,
  PRICE_UNIT_LABELS,
} from "@/app/admin/components/services/catalog-format";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";

type BookingServiceSummaryProps = {
  service: ServiceItem;
};

// Snapshot of the preselected catalog service on the booking entry.
// Read-only: price and duration come from the public catalog cache.
export function BookingServiceSummary({ service }: BookingServiceSummaryProps) {
  return (
    <section
      aria-label={`Dịch vụ đã chọn: ${service.name}`}
      data-reveal
      className="rounded-2xl border border-zinc-200 bg-white p-4 md:p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <p className="text-[11px] font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
        {service.categoryName}
      </p>
      <h2 className="mt-1 text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        {service.name}
      </h2>
      {service.description && (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {service.description}
        </p>
      )}
      <p className="mt-3 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {formatVnd(service.basePrice)}
        </span>
        <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
          {PRICE_UNIT_LABELS[service.priceUnit]}
        </span>
      </p>
      <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1 rounded-full border border-zinc-200 px-2 py-1 dark:border-zinc-800">
          <FiClock aria-hidden="true" className="h-3 w-3" />
          {formatDuration(service.durationMin)}
        </span>
        {service.isHomeSupported && (
          <span className="flex items-center gap-1 rounded-full border border-zinc-200 px-2 py-1 dark:border-zinc-800">
            <FiHome aria-hidden="true" className="h-3 w-3" />
            Tại nhà
          </span>
        )}
        {service.isEmergencySupported && (
          <span className="flex items-center gap-1 rounded-full border border-zinc-200 px-2 py-1 dark:border-zinc-800">
            <FiLifeBuoy aria-hidden="true" className="h-3 w-3" />
            Cứu hộ
          </span>
        )}
      </p>
    </section>
  );
}
