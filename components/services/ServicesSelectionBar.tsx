"use client";

import Link from "next/link";
import { FiArrowRight, FiChevronDown } from "react-icons/fi";
import {
  formatDuration,
  formatVnd,
} from "@/app/admin/components/services/catalog-format";
import { FormAlert } from "@/components/auth/FormAlert";
import { SelectedServiceLines } from "@/components/booking/SelectedServiceLines";
import { BRAND_PRIMARY_BUTTON } from "@/components/ui/brand";
import { buildBookingHref } from "@/lib/auth/auth-redirect";
import type { getBookingServiceSelection } from "@/lib/booking/booking-service-selection";

type ServicesSelectionBarProps = {
  serviceIds: readonly string[];
  selection: ReturnType<typeof getBookingServiceSelection>;
  ready: boolean;
  onRemove: (id: string) => void;
  onClear: () => void;
};

// The bar's continue button is the screen's single orange action.
const CONTINUE_CLASSES = `${BRAND_PRIMARY_BUTTON} shrink-0`;

// Docked to the bottom edge on phones (count + subtotal left, orange
// continue right); a floating card with the editable list from sm up.
export function ServicesSelectionBar({
  serviceIds,
  selection,
  ready,
  onRemove,
  onClear,
}: ServicesSelectionBarProps) {
  if (serviceIds.length === 0) return null;
  const canContinue = ready && selection.issue === null;
  return (
    <section
      aria-label="Lịch hẹn đã chọn"
      data-dock-bar
      className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-6xl flex-col gap-2 border-t border-zinc-200 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:inset-x-6 sm:bottom-[max(1rem,env(safe-area-inset-bottom))] sm:rounded-2xl sm:border sm:border-zinc-300 sm:p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:dark:border-zinc-700"
    >
      <div className="flex items-center justify-between gap-3">
        <div aria-live="polite" className="min-w-0">
          <h2 className="text-[11px] text-zinc-500 sm:text-sm sm:font-bold sm:text-zinc-900 dark:text-zinc-400 sm:dark:text-zinc-50">
            {serviceIds.length} dịch vụ đã chọn
          </h2>
          {ready ? (
            <p className="flex flex-wrap items-baseline gap-x-2 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="text-lg font-extrabold tracking-tight text-[#1E3A5F] sm:text-xl dark:text-zinc-50">
                {formatVnd(selection.subtotal)}
              </span>
              <span className="hidden sm:inline">
                Tạm tính · Khoảng {formatDuration(selection.durationMin)}
              </span>
            </p>
          ) : (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Đang kiểm tra danh sách đã chọn…
            </p>
          )}
        </div>
        {canContinue ? (
          <Link
            href={buildBookingHref(serviceIds)}
            prefetch
            className={CONTINUE_CLASSES}
          >
            Tiếp tục đặt lịch
            <FiArrowRight
              aria-hidden="true"
              className="hidden h-4 w-4 sm:block"
            />
          </Link>
        ) : (
          <button type="button" disabled className={CONTINUE_CLASSES}>
            Kiểm tra danh sách
          </button>
        )}
      </div>
      {ready && selection.issue && <FormAlert message={selection.issue} />}
      <div className="hidden items-start gap-2 border-t border-zinc-200 sm:flex dark:border-zinc-800">
        <details className="group min-w-0 flex-1">
          <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-2 rounded-lg text-xs font-semibold text-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 dark:text-zinc-200">
            Xem và chỉnh danh sách
            <FiChevronDown
              aria-hidden="true"
              className="h-4 w-4 group-open:rotate-180 motion-safe:transition-transform motion-safe:duration-200"
            />
          </summary>
          {ready && (
            <div className="max-h-[40dvh] overflow-y-auto pr-1">
              <SelectedServiceLines
                serviceIds={serviceIds}
                services={selection.services}
                onRemove={onRemove}
              />
            </div>
          )}
        </details>
        <button
          type="button"
          onClick={onClear}
          className="min-h-[44px] shrink-0 rounded-lg px-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Bỏ chọn tất cả
        </button>
      </div>
    </section>
  );
}
