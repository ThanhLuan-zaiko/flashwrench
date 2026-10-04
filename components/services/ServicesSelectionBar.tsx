"use client";

import Link from "next/link";
import { FiArrowRight, FiChevronDown } from "react-icons/fi";
import {
  formatDuration,
  formatVnd,
} from "@/app/admin/components/services/catalog-format";
import { FormAlert } from "@/components/auth/FormAlert";
import { SelectedServiceLines } from "@/components/booking/SelectedServiceLines";
import { buildBookingHref } from "@/lib/auth/auth-redirect";
import type { getBookingServiceSelection } from "@/lib/booking/booking-service-selection";

type ServicesSelectionBarProps = {
  serviceIds: readonly string[];
  selection: ReturnType<typeof getBookingServiceSelection>;
  ready: boolean;
  onRemove: (id: string) => void;
  onClear: () => void;
};

const CONTINUE_CLASSES =
  "flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white motion-safe:transition-colors motion-safe:duration-200 hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200";

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
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-6xl flex-col gap-2 rounded-2xl border border-zinc-300 bg-white p-3 sm:inset-x-6 sm:bottom-[max(1rem,env(safe-area-inset-bottom))] sm:p-4 dark:border-zinc-700 dark:bg-zinc-950"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div aria-live="polite" className="min-w-0">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            Đã chọn {serviceIds.length} dịch vụ
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {ready
              ? `Tạm tính ${formatVnd(selection.subtotal)} · Khoảng ${formatDuration(selection.durationMin)}`
              : "Đang kiểm tra danh sách đã chọn…"}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
            Một xe · Một địa chỉ · Một khung giờ
          </p>
        </div>
        {canContinue ? (
          <Link
            href={buildBookingHref(serviceIds)}
            prefetch
            className={CONTINUE_CLASSES}
          >
            Tiếp tục đặt lịch
            <FiArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        ) : (
          <button type="button" disabled className={CONTINUE_CLASSES}>
            Kiểm tra danh sách
          </button>
        )}
      </div>
      {ready && selection.issue && <FormAlert message={selection.issue} />}
      <div className="flex items-start gap-2 border-t border-zinc-200 dark:border-zinc-800">
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
