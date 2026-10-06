import type { BookingFieldErrors } from "@/services/booking.api";
import type { MapAddressValues } from "@/services/geocode.api";
import {
  type AddressValues,
  BookingAddressSection,
} from "./BookingAddressSection";
import { BookingMapSection } from "./BookingMapSection";
import { BookingStep } from "./BookingStep";
import type { MapPoint } from "./MapPicker";

type BookingLocationSectionProps = {
  coords: MapPoint | null;
  address: AddressValues;
  errors: BookingFieldErrors;
  disabled: boolean;
  onCoords: (point: MapPoint) => void;
  onMapAddress: (values: MapAddressValues) => void;
  onAddress: (field: keyof AddressValues, value: string) => void;
};

// Step 2 of the booking flow: the map pin (or address search) fills the
// typed address fields below, which stay editable afterwards.
export function BookingLocationSection({
  coords,
  address,
  errors,
  disabled,
  onCoords,
  onMapAddress,
  onAddress,
}: BookingLocationSectionProps) {
  return (
    <BookingStep
      step={2}
      tour="booking-location"
      title="Địa điểm sửa xe"
      description="Ghim vị trí trên bản đồ hoặc tìm địa chỉ — các ô bên dưới sẽ tự điền, bạn vẫn có thể sửa lại."
    >
      <BookingMapSection
        lat={coords?.lat ?? null}
        lng={coords?.lng ?? null}
        error={errors.location}
        onCoords={onCoords}
        onAddress={onMapAddress}
      />
      <BookingAddressSection
        values={address}
        errors={errors}
        disabled={disabled}
        onChange={onAddress}
      />
    </BookingStep>
  );
}
