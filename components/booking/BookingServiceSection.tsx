import Link from "next/link";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";
import {
  BookingField,
  BookingServiceSelect,
  type ServiceOption,
} from "./BookingFormFields";
import { BookingServiceSummary } from "./BookingServiceSummary";

type BookingServiceSectionProps = {
  preselected: ServiceItem | null;
  options: ServiceOption[];
  serviceId: string;
  error?: string;
  disabled?: boolean;
  onServiceId: (value: string) => void;
};

// Service step: the preselected catalog service renders as a read-only
// snapshot, otherwise the customer picks from the live price list.
export function BookingServiceSection({
  preselected,
  options,
  serviceId,
  error,
  disabled,
  onServiceId,
}: BookingServiceSectionProps) {
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
