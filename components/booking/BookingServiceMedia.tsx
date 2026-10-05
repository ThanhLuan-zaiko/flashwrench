"use client";

import type { ServiceItem } from "@/lib/catalog/service-catalog.types";
import { BookingServiceGallery } from "./BookingServiceGallery";
import { BookingServiceSummary } from "./BookingServiceSummary";

type BookingServiceMediaProps = {
  service: ServiceItem | null;
  multiple: boolean;
};

// In-flow preview panel inside step 1: the gallery and facts of the
// service the customer last inspected. With several services the
// per-line image toggles switch what this panel shows.
export function BookingServiceMedia({
  service,
  multiple,
}: BookingServiceMediaProps) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <BookingServiceGallery key={service?.id ?? "none"} service={service} />
      {service && <BookingServiceSummary service={service} />}
      {multiple && (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          Bấm biểu tượng ảnh ở từng dịch vụ để xem ảnh và đánh giá tương ứng.
        </p>
      )}
    </div>
  );
}
