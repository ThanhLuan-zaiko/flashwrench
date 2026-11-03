import { FiEye, FiTool } from "react-icons/fi";
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

const ADD_BUTTON =
  "flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-xl border border-[#1E3A5F] bg-[#1E3A5F] px-4 text-sm font-bold text-white motion-safe:transition-colors motion-safe:duration-200 hover:bg-[#0F1E33] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A5F] disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-[0.99] dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white";
const REMOVE_BUTTON =
  "flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-xl border border-[#1E3A5F] bg-white px-4 text-sm font-bold text-[#1E3A5F] motion-safe:transition-colors motion-safe:duration-200 hover:bg-[#1E3A5F]/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A5F] motion-safe:active:scale-[0.99] dark:border-zinc-100 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900";
// Bare eye icon: a 44px touch target with no box around the glyph.
const PREVIEW_BUTTON =
  "flex min-h-11 min-w-11 shrink-0 items-center justify-center text-zinc-500 motion-safe:transition-colors motion-safe:duration-200 hover:text-[#1E3A5F] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] dark:text-zinc-400 dark:hover:text-zinc-50 dark:focus-visible:ring-zinc-100";

// One bookable service as a card: photo on top, then the category, name,
// duration and options, the voucher badge, the starting price, and the add
// and preview actions. Hairlines separate the price and the actions.
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
      aria-label={service.name}
      className={`group flex w-full flex-col overflow-hidden rounded-2xl border bg-white transition-colors duration-200 dark:bg-zinc-950 ${
        selected
          ? "border-[#1E3A5F] dark:border-zinc-100"
          : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
      }`}
    >
      <button
        type="button"
        onClick={onPreview}
        tabIndex={-1}
        aria-hidden="true"
        className="block aspect-[16/10] w-full shrink-0 overflow-hidden bg-zinc-100 dark:bg-zinc-900"
      >
        {service.imageUrl ? (
          // biome-ignore lint/performance/noImgElement: dynamic catalog cover served immutable; next/image optimizer hop needs sharp for zero benefit.
          <img
            src={service.imageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.03]"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-zinc-400 dark:text-zinc-600">
            <FiTool aria-hidden="true" className="h-6 w-6" />
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col gap-4 p-4 md:p-5">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold tracking-[0.08em] text-[#1E3A5F] uppercase dark:text-zinc-400">
            {service.categoryName}
          </p>
          <h3 className="mt-1 line-clamp-2 text-base leading-snug font-bold tracking-tight text-zinc-900 md:text-lg dark:text-zinc-50">
            {service.name}
          </h3>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            {attributes}
          </p>
        </div>

        <ApplicableVoucherBadge
          kind="booking"
          subtotal={service.basePrice}
          guestHint={false}
        />

        <div className="mt-auto flex flex-col gap-4">
          <p className="flex flex-wrap items-baseline gap-x-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">từ</span>
            <span className="text-xl font-extrabold tracking-tight text-[#1E3A5F] tabular-nums dark:text-zinc-50">
              {formatVnd(service.basePrice)}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {PRICE_UNIT_LABELS[service.priceUnit]}
            </span>
          </p>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
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
                className={selected ? REMOVE_BUTTON : ADD_BUTTON}
              >
                {selected ? "Đã chọn" : "Chọn"}
              </button>
              <button
                type="button"
                onClick={onPreview}
                aria-label={`Xem nhanh chi tiết ${service.name}`}
                title="Xem nhanh"
                className={PREVIEW_BUTTON}
              >
                <FiEye aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
            {!selected && disabledReason && (
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {disabledReason}
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
