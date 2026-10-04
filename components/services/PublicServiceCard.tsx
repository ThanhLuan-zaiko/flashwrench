import { FiCheck, FiClock, FiHome, FiLifeBuoy, FiPlus } from "react-icons/fi";
import {
  formatDuration,
  formatVnd,
  PRICE_UNIT_LABELS,
} from "@/app/admin/components/services/catalog-format";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";
import { ApplicableVoucherBadge } from "../vouchers/ApplicableVoucherBadge";

type PublicServiceCardProps = {
  service: ServiceItem;
  selected: boolean;
  disabledReason: string | null;
  onToggle: () => void;
};

// One bento cell for a bookable service: price, duration and support
// badges plus a booking entry. Monochrome, 44px touch target.
export function PublicServiceCard({
  service,
  selected,
  disabledReason,
  onToggle,
}: PublicServiceCardProps) {
  return (
    <article
      data-reveal
      aria-label={service.name}
      className={`flex min-w-0 flex-col justify-between gap-3 rounded-2xl border bg-white p-4 dark:bg-zinc-950 ${selected ? "border-zinc-900 dark:border-zinc-100" : "border-zinc-200 dark:border-zinc-800"}`}
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
        <h3 className="mt-1 break-words text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
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
      <div className="mt-auto flex flex-col gap-2">
        <button
          type="button"
          aria-pressed={selected}
          aria-label={
            selected
              ? `Bỏ chọn ${service.name}`
              : `Thêm ${service.name} vào lịch hẹn`
          }
          disabled={!selected && Boolean(disabledReason)}
          onClick={onToggle}
          className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold motion-safe:transition-colors motion-safe:duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 disabled:cursor-not-allowed disabled:opacity-50 ${selected ? "border-zinc-300 bg-zinc-100 text-zinc-800 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800" : "border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-700 dark:border-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"}`}
        >
          {selected ? (
            <FiCheck aria-hidden="true" className="h-4 w-4 shrink-0" />
          ) : (
            <FiPlus aria-hidden="true" className="h-4 w-4 shrink-0" />
          )}
          {selected ? "Đã thêm · Bỏ chọn" : "Thêm vào lịch hẹn"}
        </button>
        {!selected && disabledReason && (
          <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            {disabledReason}
          </p>
        )}
      </div>
      <ApplicableVoucherBadge kind="booking" subtotal={service.basePrice} />
    </article>
  );
}
