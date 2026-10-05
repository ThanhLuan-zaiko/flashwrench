import { FiClock, FiHome, FiLifeBuoy } from "react-icons/fi";
import { formatDuration } from "@/app/admin/components/services/catalog-format";
import { BOOKING_DEFAULT_DURATION_MIN } from "@/lib/booking/booking-services.constants";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";

type BookingServiceSummaryProps = {
  service: ServiceItem;
};

// Compact facts of the service previewed in step 1's media panel:
// category, name, a short description and the capability chips. Price
// lives once, in the summary aside — never duplicated here.
export function BookingServiceSummary({ service }: BookingServiceSummaryProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <p className="text-[11px] font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
        {service.categoryName}
      </p>
      <h3 className="break-words text-sm font-bold text-zinc-900 dark:text-zinc-50">
        {service.name}
      </h3>
      {service.description && (
        <p className="line-clamp-3 text-xs text-zinc-500 dark:text-zinc-400">
          {service.description}
        </p>
      )}
      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1 rounded-full border border-zinc-200 px-2 py-1 dark:border-zinc-800">
          <FiClock aria-hidden="true" className="h-3 w-3" />
          {formatDuration(
            service.durationMin > 0
              ? service.durationMin
              : BOOKING_DEFAULT_DURATION_MIN,
          )}
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
  );
}
