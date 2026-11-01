import Link from "next/link";
import { FiArrowRight, FiImage, FiMinus, FiPlus } from "react-icons/fi";
import {
  formatVnd,
  PRICE_UNIT_LABELS,
} from "@/app/admin/components/services/catalog-format";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";
import { ServiceGallery } from "./ServiceGallery";
import { servicePhotos } from "./service-photos";

type HomeServiceRowProps = {
  service: ServiceItem;
  index: number;
  open: boolean;
  onToggle: () => void;
};

// One catalog service as an accordion row. The closed row shows the number,
// name, starting price and a small photo. Opening it reveals a wide photo and
// the description; the panel links to the service detail page.
export function HomeServiceRow({
  service,
  index,
  open,
  onToggle,
}: HomeServiceRowProps) {
  const panelId = `service-panel-${service.id}`;
  const Toggle = open ? FiMinus : FiPlus;

  return (
    <li>
      <span
        data-rule
        aria-hidden="true"
        className="block h-px origin-left bg-zinc-200 dark:bg-zinc-800"
      />
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="group grid w-full grid-cols-[2rem_minmax(0,1fr)_6.5rem] items-center gap-x-4 py-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 sm:grid-cols-[2.5rem_minmax(0,1fr)_9rem] md:grid-cols-[4rem_minmax(0,1fr)_auto_13rem] md:gap-x-8 md:py-6"
      >
        <span className="self-start pt-1 text-sm font-semibold text-zinc-500 tabular-nums dark:text-zinc-400">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[11px] font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            {service.categoryName}
          </span>
          <span className="mt-1 flex items-center gap-2 text-lg font-bold tracking-tight text-zinc-900 md:text-3xl dark:text-zinc-50">
            <span className="line-clamp-2 min-w-0">{service.name}</span>
            <Toggle
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-zinc-500 md:h-5 md:w-5 dark:text-zinc-400"
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
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-zinc-300 dark:text-zinc-700">
              <FiImage aria-hidden="true" className="h-8 w-8" />
            </span>
          )}
        </span>
      </button>
      <div
        id={panelId}
        inert={!open}
        className={`grid motion-safe:transition-[grid-template-rows] motion-safe:duration-300 motion-safe:ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="grid gap-6 pb-8 pl-12 sm:pl-14 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:gap-10 md:pl-24">
            <ServiceGallery photos={servicePhotos(service)} active={open} />
            <div className="flex flex-col justify-between gap-4">
              {service.description ? (
                <p className="line-clamp-4 text-sm text-zinc-600 md:text-base dark:text-zinc-400">
                  {service.description}
                </p>
              ) : null}
              <Link
                href={`/services/${encodeURIComponent(service.slug)}`}
                aria-label={`Xem dịch vụ ${service.name}`}
                className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-bold text-[#1E3A5F] underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] dark:text-zinc-100 dark:focus-visible:ring-zinc-100"
              >
                Xem dịch vụ
                <FiArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
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
