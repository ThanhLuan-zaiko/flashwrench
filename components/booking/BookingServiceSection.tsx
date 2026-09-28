import Link from "next/link";
import { useMemo } from "react";
import { SelectDropdown } from "@/app/admin/components/services/SelectDropdown";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";
import { BookingServiceSummary } from "./BookingServiceSummary";
import { toServiceSelectOptions } from "./service-select-options";

type BookingServiceSectionProps = {
  preselected: ServiceItem | null;
  services: ServiceItem[];
  serviceId: string;
  error?: string;
  disabled?: boolean;
  onServiceId: (value: string) => void;
};

// Service step: the preselected catalog service renders as a read-only
// snapshot, otherwise the customer picks from the shared dropdown used
// across the repo with live search once the price list grows.
export function BookingServiceSection({
  preselected,
  services,
  serviceId,
  error,
  disabled,
  onServiceId,
}: BookingServiceSectionProps) {
  const options = useMemo(() => toServiceSelectOptions(services), [services]);
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
    <div className="flex flex-col gap-1.5">
      <SelectDropdown
        id="serviceId"
        label="Dịch vụ"
        required
        value={serviceId}
        options={options}
        onChange={onServiceId}
        placeholder="Chọn dịch vụ…"
        listLabel="Chọn dịch vụ"
        searchPlaceholder="Tìm dịch vụ…"
        unitName="dịch vụ"
        emptyTitle="Không tìm thấy dịch vụ phù hợp"
        emptyHint="Thử từ khóa khác"
        error={error}
        disabled={disabled}
      />
      {error && (
        <p
          role="alert"
          className="text-[11px] font-medium text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}
