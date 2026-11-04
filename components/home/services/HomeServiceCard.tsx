import Link from "next/link";
import { FiArrowRight, FiImage } from "react-icons/fi";
import {
  formatDuration,
  formatVnd,
  PRICE_UNIT_LABELS,
} from "@/app/admin/components/services/catalog-format";
import { buildBookingHref } from "@/lib/auth/auth-redirect";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";

// One catalog service as a card: photo on top, then the category, name,
// starting price and duration, with a link straight into booking.
export function HomeServiceCard({ service }: { service: ServiceItem }) {
  return (
    <li
      data-chapter-row
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
    >
      <span className="relative block h-40 w-full overflow-hidden bg-zinc-100 md:h-44 dark:bg-zinc-900">
        {service.imageUrl ? (
          // biome-ignore lint/performance/noImgElement: dynamic catalog cover served immutable; next/image optimizer hop adds no value here.
          <img
            src={service.imageUrl}
            alt=""
            loading="lazy"
            data-chapter-photo
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-zinc-300 dark:text-zinc-400">
            <FiImage aria-hidden="true" className="h-8 w-8" />
          </span>
        )}
      </span>
      <div className="flex flex-1 flex-col gap-3 p-4 md:p-5">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold tracking-wide text-zinc-600 uppercase dark:text-zinc-400">
            {service.categoryName}
          </p>
          <h3 className="mt-1 line-clamp-2 text-base font-bold tracking-tight text-zinc-900 md:text-lg dark:text-zinc-50">
            {service.name}
          </h3>
        </div>
        <p className="flex flex-wrap items-baseline gap-1.5">
          <span className="text-xs text-zinc-600 dark:text-zinc-400">từ</span>
          <span className="text-lg font-bold tracking-tight text-[#111111] dark:text-zinc-50">
            {formatVnd(service.basePrice)}
          </span>
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            {PRICE_UNIT_LABELS[service.priceUnit]}
          </span>
        </p>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Thời gian làm: {formatDuration(service.durationMin)}
        </p>
        <Link
          href={buildBookingHref(service.id)}
          aria-label={`Đặt lịch ${service.name}`}
          className="mt-auto inline-flex min-h-11 w-fit items-center gap-1.5 text-sm font-bold text-[#1D4ED8] underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] dark:text-blue-300 dark:focus-visible:ring-zinc-100"
        >
          Đặt lịch dịch vụ này
          <FiArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </li>
  );
}
