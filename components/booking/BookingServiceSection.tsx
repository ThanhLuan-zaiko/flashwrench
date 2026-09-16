import Link from "next/link";
import { useMemo } from "react";
import { formatVnd } from "@/app/admin/components/services/catalog-format";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";
import { BookingField, BookingServiceSelect } from "./BookingFormFields";
import { BookingServiceSummary } from "./BookingServiceSummary";

type BookingServiceSectionProps = {
  preselected: ServiceItem | null;
  services: ServiceItem[];
  serviceId: string;
  error?: string;
  disabled?: boolean;
  onServiceId: (value: string) => void;
};

// Service step: the preselected catalog service renders as a read-only
// snapshot, otherwise the customer picks from the live price list.
export function BookingServiceSection({
  preselected,
  services,
  serviceId,
  error,
  disabled,
  onServiceId,
}: BookingServiceSectionProps) {
  const options = useMemo(
    () =>
      services.map((service) => ({
        id: service.id,
        label: `${service.categoryName} — ${service.name} (${formatVnd(service.basePrice)})`,
      })),
    [services],
  );
  if (preselected) {
    return (
      <div className="flex flex-col gap-2">
        <BookingServiceSummary service={preselected} />
        <Link
          href="/services"
          scroll={false}
          className="self-start text-xs font-semibold text-zinc-600 underline-offset-4 transition-colors duration-200 hover:underline dark:text-zinc-400"
        >
          Đổi dịch vụ khác
        </Link>
      </div>
    );
  }
  return (
    <BookingField id="serviceId" label="Dịch vụ" required error={error}>
      <BookingServiceSelect
        id="serviceId"
        value={serviceId}
        options={options}
        onChange={onServiceId}
        error={error}
        disabled={disabled}
      />
    </BookingField>
  );
}
