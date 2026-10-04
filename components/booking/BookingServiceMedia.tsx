"use client";

import { SelectDropdown } from "@/app/admin/components/services/SelectDropdown";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";
import { BookingServiceGallery } from "./BookingServiceGallery";
import { toServiceSelectOptions } from "./service-select-options";

type BookingServiceMediaProps = {
  services: ServiceItem[];
  service: ServiceItem | null;
  onInspect: (id: string) => void;
};

export function BookingServiceMedia({
  services,
  service,
  onInspect,
}: BookingServiceMediaProps) {
  return (
    <div className="flex flex-col gap-3 lg:col-start-2 xl:col-start-3 xl:row-span-3 xl:self-start xl:sticky xl:top-20">
      {services.length > 1 && (
        <SelectDropdown
          label="Xem hình ảnh và đánh giá"
          value={service?.id ?? ""}
          options={toServiceSelectOptions(services)}
          onChange={onInspect}
          listLabel="Dịch vụ để xem chi tiết"
          unitName="dịch vụ"
        />
      )}
      <BookingServiceGallery key={service?.id ?? "none"} service={service} />
    </div>
  );
}
