"use client";

import Link from "next/link";
import { useState } from "react";
import { FiTool } from "react-icons/fi";
import {
  BRAND_OUTLINE_BUTTON,
  BRAND_PRIMARY_BUTTON,
} from "@/components/ui/brand";
import { useDialogFocus } from "@/hooks/useDialogFocus";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";

type ServiceBookingConflictDialogProps = {
  service: ServiceItem;
  selected: readonly ServiceItem[];
  message: string;
  onQueue: () => void;
  onSwitch: () => void;
  onClose: () => void;
};

// Small clipped photo of the picked service, with a bare icon when the service
// has no image or the file fails to load.
function ServiceThumb({ imageUrl }: { imageUrl: string | null | undefined }) {
  const [failed, setFailed] = useState(false);
  if (!imageUrl || failed) {
    return (
      <FiTool
        aria-hidden="true"
        className="mt-0.5 h-6 w-6 shrink-0 text-zinc-600 dark:text-zinc-400"
      />
    );
  }
  return (
    // biome-ignore lint/performance/noImgElement: dynamic catalog cover served immutable; next/image optimizer hop needs sharp for zero benefit.
    <img
      src={imageUrl}
      alt=""
      onError={() => setFailed(true)}
      className="h-12 w-12 shrink-0 rounded-lg object-cover"
    />
  );
}

// Shown when a picked service cannot join the current appointment. The rule
// stays, but the customer always has a next step: book it right after the
// current appointment, or replace the current selection with it.
export function ServiceBookingConflictDialog({
  service,
  selected,
  message,
  onQueue,
  onSwitch,
  onClose,
}: ServiceBookingConflictDialogProps) {
  const dialogRef = useDialogFocus<HTMLDivElement>(onClose);
  const current =
    selected.length === 1 ? selected[0].name : "các dịch vụ đã chọn";

  return (
    <div
      role="dialog"
      ref={dialogRef}
      tabIndex={-1}
      aria-modal="true"
      aria-labelledby="service-conflict-title"
      className="fixed inset-0 z-[70] flex h-dvh items-end justify-center sm:items-center sm:p-4"
    >
      <button
        type="button"
        aria-label="Đóng"
        onClick={onClose}
        className="absolute inset-0 bg-[#111111]/50"
      />
      <div className="relative flex max-h-[92dvh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-t-2xl border border-zinc-200 bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-lg sm:rounded-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start gap-3">
          <ServiceThumb imageUrl={service.imageUrl} />
          <div className="flex min-w-0 flex-col gap-1.5">
            <h2
              id="service-conflict-title"
              className="text-base font-bold tracking-tight text-[#111111] dark:text-zinc-50"
            >
              Không thể đặt chung trong một lịch hẹn
            </h2>
            <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-300">
              {message}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onQueue}
            className={`${BRAND_PRIMARY_BUTTON} text-center`}
          >
            Đặt {current} trước, rồi đặt tiếp {service.name}
          </button>
          <button
            type="button"
            onClick={onSwitch}
            className={`${BRAND_OUTLINE_BUTTON} text-center`}
          >
            Đổi sang {service.name}
          </button>
          <button
            type="button"
            onClick={onClose}
            className={BRAND_OUTLINE_BUTTON}
          >
            Hủy
          </button>
        </div>
        {service.isEmergencySupported && !service.isHomeSupported && (
          <Link
            href="/rescue"
            className="flex min-h-11 items-center justify-center text-sm font-semibold text-[#1D4ED8] underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] dark:text-blue-300 dark:focus-visible:ring-zinc-100"
          >
            Xe đang hỏng giữa đường? Gửi yêu cầu cứu hộ
          </Link>
        )}
      </div>
    </div>
  );
}
