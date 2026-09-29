"use client";

import type { ServiceItem } from "@/lib/catalog/service-catalog.types";
import { ServiceReviewsCard } from "./ServiceReviewsCard";
import { TopMechanicsCard } from "./TopMechanicsCard";

type BookingReviewsSectionProps = {
  service: ServiceItem | null;
  lat: number | null;
  lng: number | null;
};

// Social proof under the booking form: what customers say about the picked
// service and who the best rated mechanics online are. The service card
// remounts per service so its pager never carries a stale cursor.
export function BookingReviewsSection({
  service,
  lat,
  lng,
}: BookingReviewsSectionProps) {
  return (
    <section
      aria-label="Đánh giá từ khách hàng"
      className="flex flex-col gap-3"
    >
      <div>
        <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Đánh giá từ khách hàng
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Xem khách hàng nhận xét thế nào về dịch vụ và thợ trước khi xác nhận
          đặt lịch.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-2">
        <ServiceReviewsCard key={service?.id ?? "none"} service={service} />
        <TopMechanicsCard lat={lat} lng={lng} />
      </div>
    </section>
  );
}
