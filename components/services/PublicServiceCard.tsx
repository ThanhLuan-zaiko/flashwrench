import { FiClock, FiHome, FiLifeBuoy } from "react-icons/fi";
import {
  formatDuration,
  formatVnd,
  PRICE_UNIT_LABELS,
} from "@/app/admin/components/services/catalog-format";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";
import { ServiceBookingButton } from "./ServiceBookingButton";

type PublicServiceCardProps = {
  service: ServiceItem;
};

// One bento cell for a bookable service: price, duration and support
// badges plus a booking entry. Monochrome, 44px touch target.
export function PublicServiceCard({ service }: PublicServiceCardProps) {
  return (
    <article
      data-reveal
      aria-label={service.name}
      className="flex flex-col justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div>
        {service.imageUrl && (
          // biome-ignore lint/performance/noImgElement: dynamic catalog cover served immutable; next/image optimizer hop needs sharp for zero benefit.
          <img
            src={service.imageUrl}
            alt=""
            loading="lazy"
            className="mb-3 h-28 w-full rounded-xl border border-zinc-200 object-cover dark:border-zinc-800"
          />
        )}
        <p className="text-[11px] font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
          {service.categoryName}
        </p>
        <h3 className="mt-1 text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {service.name}
        </h3>
        {service.description && (
          <p className="mt-1 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
            {service.description}
          </p>
        )}
        <p className="mt-3 flex items-baseline gap-1.5">
          <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
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
      </div>
      <ServiceBookingButton serviceId={service.id} serviceName={service.name} />
    </article>
  );
}
