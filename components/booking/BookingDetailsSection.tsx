import type { BookingFieldErrors } from "@/services/booking.api";
import {
  type AddressValues,
  BookingAddressSection,
} from "./BookingAddressSection";
import { BookingScheduleSection } from "./BookingScheduleSection";
import {
  BookingVehicleSection,
  type VehicleValues,
} from "./BookingVehicleSection";

type BookingDetailsSectionProps = {
  scheduledAt: string;
  min: string;
  max: string;
  address: AddressValues;
  vehicle: VehicleValues;
  errors: BookingFieldErrors;
  disabled: boolean;
  onScheduledAt: (value: string) => void;
  onAddress: (field: keyof AddressValues, value: string) => void;
  onVehicle: (field: keyof VehicleValues, value: string) => void;
};

// The typed half of the form: schedule, address and vehicle. Renders as
// the middle column between the map and the mechanic picker on desktop.
export function BookingDetailsSection({
  scheduledAt,
  min,
  max,
  address,
  vehicle,
  errors,
  disabled,
  onScheduledAt,
  onAddress,
  onVehicle,
}: BookingDetailsSectionProps) {
  return (
    <div className="flex flex-col gap-4">
      <BookingScheduleSection
        value={scheduledAt}
        min={min}
        max={max}
        error={errors.scheduledAt}
        disabled={disabled}
        onChange={onScheduledAt}
      />
      <BookingAddressSection
        values={address}
        errors={errors}
        disabled={disabled}
        onChange={onAddress}
      />
      <BookingVehicleSection
        values={vehicle}
        errors={errors}
        disabled={disabled}
        onChange={onVehicle}
      />
    </div>
  );
}
