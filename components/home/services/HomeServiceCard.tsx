import Link from "next/link";
import { FiImage } from "react-icons/fi";
import {
  formatVnd,
  PRICE_UNIT_LABELS,
} from "@/app/admin/components/services/catalog-format";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";

// Real catalog service for the home bento. Photo on top, then category,
// name and the public starting price. Links to the service detail page.
export function HomeServiceCard({ service }: { service: ServiceItem }) {
  return (
    <Link
      href={`/services/${encodeURIComponent(service.slug)}`}
      data-reveal
      aria-label={`Xem dịch vụ ${service.name}`}
      className="group flex min-w-0 flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-3 transition-colors duration-200 hover:border-[#1E3A5F]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 md:p-4 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
    >
      {service.imageUrl ? (
        // biome-ignore lint/performance/noImgElement: dynamic catalog cover served immutable; next/image optimizer hop needs sharp for zero benefit.
        <img
          src={service.imageUrl}
          alt=""
          loading="lazy"
          className="h-28 w-full rounded-xl border border-zinc-200 object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.03] sm:h-36 dark:border-zinc-800"
        />
      ) : (
        <span className="flex h-28 w-full items-center justify-center rounded-xl border border-zinc-200 text-zinc-300 sm:h-36 dark:border-zinc-800 dark:text-zinc-700">
          <FiImage aria-hidden="true" className="h-8 w-8" />
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate text-[11px] font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
          {service.categoryName}
        </p>
        <h3 className="mt-1 line-clamp-2 text-sm font-bold tracking-tight text-zinc-900 md:text-base dark:text-zinc-50">
          {service.name}
        </h3>
        <p className="mt-auto flex flex-wrap items-baseline gap-1.5 pt-3">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">từ</span>
          <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {formatVnd(service.basePrice)}
          </span>
          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            {PRICE_UNIT_LABELS[service.priceUnit]}
          </span>
        </p>
      </div>
    </Link>
  );
}
