"use client";

import { FiImage, FiX } from "react-icons/fi";
import {
  formatDuration,
  formatVnd,
  PRICE_UNIT_LABELS,
} from "@/app/admin/components/services/catalog-format";
import { BOOKING_DEFAULT_DURATION_MIN } from "@/lib/booking/booking-services.constants";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";

type SelectedServiceLinesProps = {
  serviceIds: readonly string[];
  services: readonly ServiceItem[];
  // The service currently shown in the preview panel; marks the matching
  // inspect toggle as pressed.
  activeId?: string | null;
  disabled?: boolean;
  onRemove: (id: string) => void;
  onInspect?: (id: string) => void;
};

export function SelectedServiceLines({
  serviceIds,
  services,
  activeId,
  disabled,
  onRemove,
  onInspect,
}: SelectedServiceLinesProps) {
  return (
    <ul
      aria-label="Dịch vụ đã chọn"
      className="divide-y divide-zinc-200 dark:divide-zinc-800"
    >
      {serviceIds.map((id) => {
        const service = services.find((item) => item.id === id);
        const name = service?.name ?? "Dịch vụ không còn khả dụng";
        const inspecting = id === activeId;
        return (
          <li key={id} className="flex min-w-0 items-center gap-2 py-3">
            <div className="min-w-0 flex-1">
              <p className="break-words text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {name}
              </p>
              {service && (
                <p className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>
                    {formatVnd(service.basePrice)} ·{" "}
                    {PRICE_UNIT_LABELS[service.priceUnit]}
                  </span>
                  <span>
                    {formatDuration(
                      service.durationMin > 0
                        ? service.durationMin
                        : BOOKING_DEFAULT_DURATION_MIN,
                    )}
                  </span>
                </p>
              )}
            </div>
            {onInspect && service && (
              <button
                type="button"
                onClick={() => onInspect(id)}
                aria-pressed={inspecting}
                aria-label={`Xem hình ảnh và đánh giá ${name}`}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border motion-safe:transition-colors motion-safe:duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 ${
                  inspecting
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                    : "border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                }`}
              >
                <FiImage aria-hidden="true" className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              disabled={disabled}
              onClick={() => onRemove(id)}
              aria-label={`Bỏ chọn ${name}`}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 motion-safe:transition-colors motion-safe:duration-200 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              <FiX aria-hidden="true" className="h-4 w-4" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
