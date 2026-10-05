import Link from "next/link";
import { useMemo } from "react";
import { SelectDropdown } from "@/app/admin/components/services/SelectDropdown";
import { FormAlert } from "@/components/auth/FormAlert";
import {
  type BookingServiceSelection,
  getBookingServiceSelection,
} from "@/lib/booking/booking-service-selection";
import { BOOKING_MAX_SERVICES } from "@/lib/booking/booking-services.constants";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";
import { BookingServiceMedia } from "./BookingServiceMedia";
import { BookingStep } from "./BookingStep";
import { SelectedServiceLines } from "./SelectedServiceLines";
import { toServiceSelectOptions } from "./service-select-options";

type BookingServiceSectionProps = {
  services: ServiceItem[];
  serviceIds: string[];
  selection: BookingServiceSelection;
  activeService: ServiceItem | null;
  error?: string;
  disabled?: boolean;
  onServiceIds: (value: string[]) => void;
  onInspect: (id: string) => void;
};

// Step 1 of the booking flow: picked services on the left (each with a
// media toggle when more than one is selected), the previewed service's
// gallery and facts on the right. `selection` arrives computed from the
// form so the summary aside shares one result; the `remaining` memo
// still probes which additions stay compatible.
export function BookingServiceSection({
  services,
  serviceIds,
  selection,
  activeService,
  error,
  disabled,
  onServiceIds,
  onInspect,
}: BookingServiceSectionProps) {
  const remaining = useMemo(
    () =>
      services.filter(
        (service) =>
          !serviceIds.includes(service.id) &&
          !getBookingServiceSelection([...serviceIds, service.id], services)
            .issue,
      ),
    [services, serviceIds],
  );
  const options = useMemo(() => toServiceSelectOptions(remaining), [remaining]);
  const message = error ?? selection.issue;

  return (
    <BookingStep
      step={1}
      title={`Dịch vụ đã chọn (${serviceIds.length})`}
      description={`Cùng một xe, một địa chỉ và một khung giờ. Tối đa ${BOOKING_MAX_SERVICES} dịch vụ.`}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
        <div className="flex min-w-0 flex-col gap-3">
          {serviceIds.length > 0 && (
            <SelectedServiceLines
              serviceIds={serviceIds}
              services={selection.services}
              activeId={activeService?.id ?? null}
              disabled={disabled}
              onRemove={(id) =>
                onServiceIds(serviceIds.filter((value) => value !== id))
              }
              onInspect={serviceIds.length > 1 ? onInspect : undefined}
            />
          )}
          <SelectDropdown
            id="serviceIds"
            label={
              serviceIds.length > 0 ? "Thêm dịch vụ vào lịch hẹn" : "Dịch vụ"
            }
            required={serviceIds.length === 0}
            value=""
            options={options}
            onChange={(id) => onServiceIds([...serviceIds, id])}
            placeholder={
              serviceIds.length >= BOOKING_MAX_SERVICES
                ? `Đã đủ ${BOOKING_MAX_SERVICES} dịch vụ`
                : "Chọn dịch vụ…"
            }
            listLabel="Chọn dịch vụ"
            searchPlaceholder="Tìm dịch vụ…"
            unitName="dịch vụ"
            emptyTitle="Không còn dịch vụ phù hợp để thêm"
            emptyHint="Bạn có thể bỏ một dịch vụ rồi chọn lại."
            error={message ?? undefined}
            disabled={disabled || serviceIds.length >= BOOKING_MAX_SERVICES}
          />
          {message && <FormAlert message={message} />}
          <Link
            href="/services"
            scroll={false}
            className="flex min-h-[44px] self-start items-center rounded-lg text-xs font-semibold text-zinc-600 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 dark:text-zinc-400"
          >
            Xem tất cả dịch vụ
          </Link>
        </div>
        <BookingServiceMedia
          service={activeService}
          multiple={serviceIds.length > 1}
        />
      </div>
    </BookingStep>
  );
}
