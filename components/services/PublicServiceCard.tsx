import {
  FiCheck,
  FiClock,
  FiEye,
  FiHome,
  FiLifeBuoy,
  FiPlus,
  FiTool,
} from "react-icons/fi";
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
  "flex min-h-9 min-w-0 items-center justify-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold sm:min-h-[44px] sm:gap-1.5 sm:rounded-xl sm:text-sm motion-safe:transition-colors motion-safe:duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A5F] disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-[0.99] sm:flex-none sm:px-4";
const TOGGLE_ON =
  "border-[#1E3A5F] bg-[#1E3A5F] text-white hover:bg-[#0F1E33] dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white";
const TOGGLE_OFF =
  "border-zinc-300 bg-white text-zinc-900 hover:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:border-zinc-500";
const BADGE =
  "flex items-center gap-1 rounded-full border border-zinc-200 px-2 py-0.5 dark:border-zinc-800";

// One catalog row for a bookable service, laid out like a ticket stub:
// cover on the left, category, name and the big price on the right, then
// the quick-view and select actions. A selected row is outlined in navy
// and its select button turns solid navy.
export function PublicServiceCard({
  service,
  selected,
  disabledReason,
  onToggle,
  onPreview,
}: PublicServiceCardProps) {
  return (
    <article
      data-reveal
      aria-label={service.name}
      className={`flex min-w-0 gap-3 rounded-2xl border bg-white p-3 sm:gap-3.5 sm:rounded-3xl sm:p-3.5 dark:bg-zinc-950 ${selected ? "border-[#1E3A5F] ring-1 ring-[#1E3A5F] dark:border-zinc-100 dark:ring-zinc-100" : "border-zinc-200 dark:border-zinc-800"}`}
    >
      <button
        type="button"
        onClick={onPreview}
        tabIndex={-1}
        aria-hidden="true"
        className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-100 sm:h-28 sm:w-28 sm:rounded-2xl dark:bg-zinc-900"
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
            <FiTool aria-hidden="true" className="h-8 w-8" />
          </span>
        )}
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:gap-1">
        <p className="truncate text-[10px] font-semibold tracking-[0.08em] text-[#1E3A5F] uppercase sm:text-[11px] dark:text-zinc-400">
          {service.categoryName}
        </p>
        <h3 className="break-words text-sm leading-snug font-bold tracking-tight text-zinc-900 sm:text-base dark:text-zinc-50">
          {service.name}
        </h3>
        <p className="flex flex-wrap items-baseline gap-x-1 text-[11px] text-zinc-500 sm:gap-x-1.5 sm:text-xs dark:text-zinc-400">
          từ
          <span className="text-lg font-extrabold tracking-tight text-[#1E3A5F] sm:text-xl dark:text-zinc-50">
            {formatVnd(service.basePrice)}
          </span>
          · {PRICE_UNIT_LABELS[service.priceUnit]}
        </p>
        <p className="hidden flex-wrap items-center gap-1 text-[11px] font-medium text-zinc-600 sm:flex dark:text-zinc-400">
          <span className={BADGE}>
            <FiClock aria-hidden="true" className="h-3 w-3" />
            {formatDuration(service.durationMin)}
          </span>
          {service.isHomeSupported && (
            <span className={BADGE}>
              <FiHome aria-hidden="true" className="h-3 w-3" />
              Tại nhà
            </span>
          )}
          {service.isEmergencySupported && (
            <span className={BADGE}>
              <FiLifeBuoy aria-hidden="true" className="h-3 w-3" />
              Cứu hộ
            </span>
          )}
        </p>
        <div className="mt-1.5 flex gap-2 sm:mt-1.5">
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
            {selected ? (
              <FiCheck
                aria-hidden="true"
                className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4"
              />
            ) : (
              <FiPlus
                aria-hidden="true"
                className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4"
              />
            )}
            {selected ? "Đã chọn" : "Chọn"}
          </button>
          <button
            type="button"
            onClick={onPreview}
            aria-label={`Xem nhanh chi tiết ${service.name}`}
            className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-300 sm:flex text-zinc-700 motion-safe:transition-colors motion-safe:duration-200 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A5F] motion-safe:active:scale-[0.98] dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <FiEye aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        {!selected && disabledReason && (
          <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
            {disabledReason}
          </p>
        )}
        <div className="hidden sm:block">
          <ApplicableVoucherBadge kind="booking" subtotal={service.basePrice} />
        </div>
      </div>
    </article>
  );
}
