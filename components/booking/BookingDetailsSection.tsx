import type { BookingFieldErrors } from "@/services/booking.api";
import { BookingScheduleSection } from "./BookingScheduleSection";
import { BookingStep } from "./BookingStep";
import {
  BookingVehicleSection,
  type VehicleValues,
} from "./BookingVehicleSection";

type BookingDetailsSectionProps = {
  scheduledAt: string;
  min: string;
  max: string;
  leadDays: number;
  maxDays: number;
  hoursLabel?: string | null;
  vehicle: VehicleValues;
  errors: BookingFieldErrors;
  disabled: boolean;
  onScheduledAt: (value: string) => void;
  onVehicle: (field: keyof VehicleValues, value: string) => void;
};

// Step 3 of the booking flow: the wished time slot and the vehicle the
// mechanic prepares for. Location lives in step 2, next to the map.
export function BookingDetailsSection({
  scheduledAt,
  min,
  max,
  leadDays,
  maxDays,
  hoursLabel,
  vehicle,
  errors,
  disabled,
  onScheduledAt,
  onVehicle,
}: BookingDetailsSectionProps) {
  return (
    <BookingStep step={3} title="Thời gian và xe">
      <BookingScheduleSection
        value={scheduledAt}
        min={min}
        max={max}
        leadDays={leadDays}
        maxDays={maxDays}
        hoursLabel={hoursLabel}
        error={errors.scheduledAt}
        disabled={disabled}
        onChange={onScheduledAt}
      />
      <BookingVehicleSection
        values={vehicle}
        errors={errors}
        disabled={disabled}
        onChange={onVehicle}
      />
    </BookingStep>
  );
}
