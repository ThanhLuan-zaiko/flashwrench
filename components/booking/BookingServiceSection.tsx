import Link from "next/link";
import { useMemo } from "react";
import { SelectDropdown } from "@/app/admin/components/services/SelectDropdown";
import { FormAlert } from "@/components/auth/FormAlert";
import { ApplicableVoucherPanel } from "@/components/vouchers/ApplicableVoucherPanel";
import { getBookingServiceSelection } from "@/lib/booking/booking-service-selection";
import { BOOKING_MAX_SERVICES } from "@/lib/booking/booking-services.constants";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";
import { BookingPriceSummary } from "./BookingPriceSummary";
import { BookingServiceSummary } from "./BookingServiceSummary";
import { SelectedServiceLines } from "./SelectedServiceLines";
import { toServiceSelectOptions } from "./service-select-options";

type BookingServiceSectionProps = {
  preselected: ServiceItem | null;
  services: ServiceItem[];
  serviceIds: string[];
  error?: string;
  disabled?: boolean;
  onServiceIds: (value: string[]) => void;
  onInspect: (id: string) => void;
};

// Service step: the preselected catalog service renders as a read-only
// snapshot, otherwise the customer picks from the shared dropdown used
// across the repo with live search once the price list grows.
export function BookingServiceSection({
  preselected,
  services,
  serviceIds,
  error,
  disabled,
  onServiceIds,
  onInspect,
}: BookingServiceSectionProps) {
  const selection = useMemo(
    () => getBookingServiceSelection(serviceIds, services),
    [serviceIds, services],
  );
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
  const singlePreselected =
    serviceIds.length === 1 && preselected?.id === serviceIds[0]
      ? preselected
      : null;
  const message = error ?? selection.issue;

  return (
    <section
      aria-label="Dịch vụ trong lịch hẹn"
      className="flex flex-col gap-3"
    >
      <div>
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
          Dịch vụ đã chọn ({serviceIds.length})
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Cùng một xe, một địa chỉ và một khung giờ. Tối đa{" "}
          {BOOKING_MAX_SERVICES} dịch vụ.
        </p>
      </div>
      {singlePreselected ? (
        <div className="flex flex-col gap-2">
          <BookingServiceSummary service={singlePreselected} />
          <button
            type="button"
            disabled={disabled}
            onClick={() => onServiceIds([])}
            className="min-h-[44px] self-start rounded-xl border border-zinc-200 px-3 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Bỏ dịch vụ này
          </button>
        </div>
      ) : (
        <SelectedServiceLines
          serviceIds={serviceIds}
          services={selection.services}
          disabled={disabled}
          onRemove={(id) =>
            onServiceIds(serviceIds.filter((value) => value !== id))
          }
          onInspect={onInspect}
        />
      )}
      <SelectDropdown
        id="serviceIds"
        label={serviceIds.length > 0 ? "Thêm dịch vụ vào lịch hẹn" : "Dịch vụ"}
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
      {serviceIds.length > 0 && !selection.issue && (
        <>
          <BookingPriceSummary
            subtotal={selection.subtotal}
            durationMin={selection.durationMin}
            unitPricing={selection.services.some(
              (service) => service.priceUnit !== "per_job",
            )}
          />
          {!singlePreselected && (
            <ApplicableVoucherPanel
              kind="booking"
              subtotal={selection.subtotal}
            />
          )}
        </>
      )}
      <Link
        href="/services"
        scroll={false}
        className="flex min-h-[44px] self-start items-center rounded-lg text-xs font-semibold text-zinc-600 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 dark:text-zinc-400"
      >
        Xem tất cả dịch vụ
      </Link>
    </section>
  );
}
