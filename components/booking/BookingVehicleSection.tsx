import type { BookingFieldErrors } from "@/services/booking.api";
import {
  BookingField,
  BookingTextArea,
  BookingTextInput,
} from "./BookingFormFields";

export type VehicleValues = {
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  notes: string;
};

type BookingVehicleSectionProps = {
  values: VehicleValues;
  errors: BookingFieldErrors;
  disabled?: boolean;
  onChange: (field: keyof VehicleValues, value: string) => void;
};

// Vehicle step: plate identifies the job on every denormalized copy,
// brand/model and notes help the mechanic prepare parts.
export function BookingVehicleSection({
  values,
  errors,
  disabled,
  onChange,
}: BookingVehicleSectionProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <BookingField
          id="vehiclePlate"
          label="Biển số xe"
          required
          error={errors.vehiclePlate}
        >
          <BookingTextInput
            id="vehiclePlate"
            value={values.vehiclePlate}
            onChange={(v) => onChange("vehiclePlate", v)}
            placeholder="51F-12345"
            autoComplete="off"
            error={errors.vehiclePlate}
            disabled={disabled}
          />
        </BookingField>
        <BookingField
          id="vehicleBrand"
          label="Hãng xe"
          error={errors.vehicleBrand}
        >
          <BookingTextInput
            id="vehicleBrand"
            value={values.vehicleBrand}
            onChange={(v) => onChange("vehicleBrand", v)}
            placeholder="Honda"
            autoComplete="off"
            error={errors.vehicleBrand}
            disabled={disabled}
          />
        </BookingField>
        <BookingField
          id="vehicleModel"
          label="Dòng xe"
          error={errors.vehicleModel}
        >
          <BookingTextInput
            id="vehicleModel"
            value={values.vehicleModel}
            onChange={(v) => onChange("vehicleModel", v)}
            placeholder="Wave Alpha"
            autoComplete="off"
            error={errors.vehicleModel}
            disabled={disabled}
          />
        </BookingField>
      </div>
      <BookingField id="notes" label="Ghi chú cho thợ" error={errors.notes}>
        <BookingTextArea
          id="notes"
          value={values.notes}
          onChange={(v) => onChange("notes", v)}
          placeholder="Mô tả triệu chứng xe (không bắt buộc)"
          error={errors.notes}
          disabled={disabled}
        />
      </BookingField>
    </div>
  );
}
