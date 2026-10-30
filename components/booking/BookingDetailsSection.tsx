import type { BookingFieldErrors } from "@/services/booking.api";
import { BookingStep } from "./BookingStep";
import {
  BookingVehicleSection,
  type VehicleValues,
} from "./BookingVehicleSection";

type BookingDetailsSectionProps = {
  vehicle: VehicleValues;
  errors: BookingFieldErrors;
  disabled: boolean;
  onVehicle: (field: keyof VehicleValues, value: string) => void;
};

// Last booking step: the vehicle the mechanic prepares for. The wished
// time slot lives in the location step ("Vị trí và thời gian").
export function BookingDetailsSection({
  vehicle,
  errors,
  disabled,
  onVehicle,
}: BookingDetailsSectionProps) {
  return (
    <BookingStep step={5} tour="booking-vehicle" title="Thông tin xe">
      <BookingVehicleSection
        values={vehicle}
        errors={errors}
        disabled={disabled}
        onChange={onVehicle}
      />
    </BookingStep>
  );
}
