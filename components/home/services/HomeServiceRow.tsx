import Link from "next/link";
import { FiArrowRight, FiImage } from "react-icons/fi";
import {
  formatVnd,
  PRICE_UNIT_LABELS,
} from "@/app/admin/components/services/catalog-format";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";

type HomeServiceRowProps = {
  service: ServiceItem;
  index: number;
};

// One catalog service as a ruled row: index, category and name, starting
// price and a photo that opens on scroll. Links to the service detail page.
export function HomeServiceRow({ service, index }: HomeServiceRowProps) {
  return (
    <li>
      <span
        data-rule
        aria-hidden="true"
        className="block h-px origin-left bg-zinc-200 dark:bg-zinc-800"
      />
      <Link
        href={`/services/${encodeURIComponent(service.slug)}`}
        data-chapter-row
        data-preview-src={service.imageUrl ?? undefined}
        aria-label={`Xem dịch vụ ${service.name}`}
        className="group grid grid-cols-[2rem_minmax(0,1fr)_6.5rem] items-center gap-x-4 py-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 sm:grid-cols-[2.5rem_minmax(0,1fr)_9rem] md:grid-cols-[4rem_minmax(0,1fr)_auto_13rem] md:gap-x-8 md:py-6"
      >
        <span className="self-start pt-1 text-sm font-semibold text-zinc-500 tabular-nums dark:text-zinc-400">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[11px] font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            {service.categoryName}
          </span>
          <span
            data-focus
            className="mt-1 line-clamp-2 flex items-center gap-2 text-lg font-bold tracking-tight text-zinc-900 transition-transform duration-300 motion-safe:group-hover:translate-x-1 md:text-3xl dark:text-zinc-50"
          >
            {service.name}
            <FiArrowRight
              aria-hidden="true"
              className="hidden h-5 w-5 shrink-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:block"
            />
          </span>
          <span className="mt-2 flex flex-wrap items-baseline gap-1.5 md:hidden">
            <PriceText service={service} />
          </span>
        </span>
        <span className="hidden flex-wrap items-baseline justify-end gap-1.5 text-right md:flex">
          <PriceText service={service} />
        </span>
        <span className="relative block h-20 overflow-hidden rounded-lg bg-zinc-100 sm:h-24 md:h-28 dark:bg-zinc-900">
          {service.imageUrl ? (
            // biome-ignore lint/performance/noImgElement: dynamic catalog cover served immutable; next/image optimizer hop needs sharp for zero benefit.
            <img
              src={service.imageUrl}
              alt=""
              loading="lazy"
              data-chapter-photo
              data-parallax
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-zinc-300 dark:text-zinc-700">
              <FiImage aria-hidden="true" className="h-8 w-8" />
            </span>
          )}
        </span>
      </Link>
    </li>
  );
}

function PriceText({ service }: { service: ServiceItem }) {
  return (
    <>
      <span className="text-xs text-zinc-500 dark:text-zinc-400">từ</span>
      <span className="text-base font-bold tracking-tight text-zinc-900 md:text-xl dark:text-zinc-50">
        {formatVnd(service.basePrice)}
      </span>
      <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
        {PRICE_UNIT_LABELS[service.priceUnit]}
      </span>
    </>
  );
}
