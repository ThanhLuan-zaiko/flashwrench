"use client";

import {
  FiCheck,
  FiClock,
  FiHome,
  FiLifeBuoy,
  FiPlus,
  FiX,
} from "react-icons/fi";
import {
  formatDuration,
  formatVnd,
  PRICE_UNIT_LABELS,
} from "@/app/admin/components/services/catalog-format";
import { BookingServiceGallery } from "@/components/booking/BookingServiceGallery";
import { ServiceReviewsCard } from "@/components/booking/ServiceReviewsCard";
import { SCROLLBAR_CLASSES } from "@/components/ui/scrollbar";
import { ApplicableVoucherBadge } from "@/components/vouchers/ApplicableVoucherBadge";
import { useDialogFocus } from "@/hooks/useDialogFocus";
import { BOOKING_DEFAULT_DURATION_MIN } from "@/lib/booking/booking-services.constants";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";

type ServiceQuickViewDialogProps = {
  service: ServiceItem;
  selected: boolean;
  disabledReason: string | null;
  queued?: boolean;
  separateBooking?: boolean;
  onToggle: () => void;
  onClose: () => void;
};

// Quick-view sheet for one catalog card: gallery, full description, price,
// capability chips and customer reviews. Closes on the backdrop, the X
// button or Escape; the pinned footer mirrors the card's booking toggle.
export function ServiceQuickViewDialog({
  service,
  selected,
  disabledReason,
  queued = false,
  separateBooking = false,
  onToggle,
  onClose,
}: ServiceQuickViewDialogProps) {
  const dialogRef = useDialogFocus<HTMLDivElement>(onClose);
  const picked = selected || queued;

  return (
    <div
      role="dialog"
      ref={dialogRef}
      tabIndex={-1}
      aria-modal="true"
      aria-label={`Chi tiết dịch vụ ${service.name}`}
      className="fixed inset-0 z-50 flex h-dvh items-end justify-center p-0 sm:items-center sm:p-4"
    >
      <button
        type="button"
        aria-label="Đóng chi tiết dịch vụ"
        onClick={onClose}
        className="absolute inset-0 bg-[#111111]/50"
      />
      <div className="relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-clip rounded-t-2xl border border-zinc-200 bg-white sm:rounded-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wide text-zinc-600 uppercase dark:text-zinc-400">
              {service.categoryName}
            </p>
            <h2 className="mt-0.5 break-words text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {service.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-600 dark:text-zinc-400 transition-colors duration-200 hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <FiX aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <div
          className={`min-h-0 flex-1 overflow-y-auto px-5 py-4 ${SCROLLBAR_CLASSES}`}
        >
          <div className="flex flex-col gap-4">
            <BookingServiceGallery service={service} />

            <section
              aria-label="Giới thiệu dịch vụ"
              className="flex flex-col gap-1.5"
            >
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-300">
                Giới thiệu
              </p>
              <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-300">
                {service.description || "Dịch vụ này chưa có mô tả chi tiết."}
              </p>
            </section>

            <section
              aria-label="Giá và hình thức hỗ trợ"
              className="flex flex-col gap-2"
            >
              <p className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold tracking-tight text-[#111111] dark:text-zinc-50">
                  {formatVnd(service.basePrice)}
                </span>
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  {PRICE_UNIT_LABELS[service.priceUnit]}
                </span>
              </p>
              <p className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
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
            </section>

            <ApplicableVoucherBadge
              kind="booking"
              subtotal={service.basePrice}
            />
            <ServiceReviewsCard service={service} />
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-zinc-200 bg-white px-5 py-3 dark:border-zinc-800 dark:bg-zinc-950">
          <button
            type="button"
            aria-pressed={picked}
            aria-label={
              picked
                ? `Bỏ chọn ${service.name}`
                : `Thêm ${service.name} vào lịch hẹn`
            }
            disabled={!picked && Boolean(disabledReason)}
            onClick={onToggle}
            className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold motion-safe:transition-colors motion-safe:duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 disabled:cursor-not-allowed disabled:opacity-50 ${picked ? "border-zinc-500 bg-zinc-100 text-zinc-800 hover:bg-zinc-200 dark:border-zinc-500 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800" : "border-[#111111] bg-[#FB923C] text-[#111111] hover:bg-[#F97316] dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"}`}
          >
            {picked ? (
              <FiCheck aria-hidden="true" className="h-4 w-4 shrink-0" />
            ) : (
              <FiPlus aria-hidden="true" className="h-4 w-4 shrink-0" />
            )}
            {selected
              ? "Đã thêm · Bỏ chọn"
              : queued
                ? "Lịch tiếp theo · Bỏ chọn"
                : "Thêm vào lịch hẹn"}
          </button>
          {!picked && (disabledReason || separateBooking) && (
            <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              {disabledReason ?? "Cần đặt lịch riêng"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
