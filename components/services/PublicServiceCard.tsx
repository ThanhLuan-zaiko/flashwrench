import { FiTool } from "react-icons/fi";
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
  onPreview: () => void;
};

const TOGGLE_BASE =
  "flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-lg border px-5 text-base font-bold motion-safe:transition-colors motion-safe:duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A5F] disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-[0.99]";
const TOGGLE_ON =
  "border-[#1E3A5F] bg-[#1E3A5F] text-white hover:bg-[#0F1E33] dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white";
const TOGGLE_OFF =
  "border-zinc-300 bg-white text-zinc-900 hover:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:border-zinc-500";
const TEXT_ACTION =
  "flex min-h-11 items-center text-base font-bold text-[#1E3A5F] underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] dark:text-zinc-100 dark:focus-visible:ring-zinc-100";

// One bookable service as a full-width ruled row. Phones keep the cover on
// the left with the text stacked beside it; from md the row reads cover,
// category and name with duration and options, the price, then the actions.
// The list wrapper draws the hairlines between rows.
export function PublicServiceCard({
  service,
  selected,
  disabledReason,
  onToggle,
  onPreview,
}: PublicServiceCardProps) {
  const attributes = [
    formatDuration(service.durationMin),
    service.isHomeSupported ? "Tại nhà" : null,
    service.isEmergencySupported ? "Cứu hộ" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article
      data-chapter-row
      aria-label={service.name}
      className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-4 gap-y-2 py-5 sm:grid-cols-[9rem_minmax(0,1fr)] md:grid-cols-[9rem_minmax(0,1fr)_minmax(0,12rem)_auto] md:items-center md:gap-x-8 md:py-6"
    >
      <button
        type="button"
        onClick={onPreview}
        tabIndex={-1}
        aria-hidden="true"
        className="row-span-3 h-20 overflow-hidden rounded-lg bg-zinc-100 sm:h-24 md:row-span-1 md:h-28 dark:bg-zinc-900"
      >
        {service.imageUrl ? (
          // biome-ignore lint/performance/noImgElement: dynamic catalog cover served immutable; next/image optimizer hop needs sharp for zero benefit.
          <img
            src={service.imageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-zinc-400 dark:text-zinc-600">
            <FiTool aria-hidden="true" className="h-6 w-6" />
          </span>
        )}
      </button>

      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="truncate text-xs font-semibold tracking-[0.08em] text-[#1E3A5F] uppercase dark:text-zinc-400">
          {service.categoryName}
        </p>
        <h3 className="break-words text-base leading-snug font-bold tracking-tight text-zinc-900 md:text-lg dark:text-zinc-50">
          {service.name}
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{attributes}</p>
        <div className="hidden md:block">
          <ApplicableVoucherBadge
            kind="booking"
            subtotal={service.basePrice}
            guestHint={false}
          />
        </div>
      </div>

      <p className="flex flex-wrap items-baseline gap-x-1.5 text-sm text-zinc-500 md:flex-col md:items-end md:gap-0 dark:text-zinc-400">
        từ
        <span className="text-base font-extrabold tracking-tight text-[#1E3A5F] md:text-lg dark:text-zinc-50">
          {formatVnd(service.basePrice)}
        </span>
        <span className="md:text-xs">
          {PRICE_UNIT_LABELS[service.priceUnit]}
        </span>
      </p>

      <div className="flex flex-col gap-1 md:items-end">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 md:flex-row-reverse">
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
            className={`${TOGGLE_BASE} ${selected ? TOGGLE_ON : TOGGLE_OFF}`}
          >
            {selected ? "Đã chọn" : "Chọn"}
          </button>
          <button
            type="button"
            onClick={onPreview}
            aria-label={`Xem nhanh chi tiết ${service.name}`}
            className={TEXT_ACTION}
          >
            Xem nhanh
          </button>
        </div>
        {!selected && disabledReason && (
          <p className="max-w-xs text-sm leading-relaxed text-zinc-600 md:text-right dark:text-zinc-400">
            {disabledReason}
          </p>
        )}
      </div>
    </article>
  );
}
