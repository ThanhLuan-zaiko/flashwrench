import type { RescueFieldErrors } from "@/services/rescue.api";
import { BookingField, BookingTextInput } from "../booking/BookingFormFields";
import type { RescueVehicleValues } from "./useRescueForm";

type RescueVehicleSectionProps = {
  values: RescueVehicleValues;
  errors: RescueFieldErrors;
  disabled: boolean;
  onChange: (field: keyof RescueVehicleValues, value: string) => void;
};

// Vehicle step: plate identifies the job on every copy, brand/model
// help the mechanic bring the right parts.
export function RescueVehicleSection({
  values,
  errors,
  disabled,
  onChange,
}: RescueVehicleSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <BookingField
        id="rescue-vehiclePlate"
        label="Biển số xe"
        required
        error={errors.vehiclePlate}
      >
        <BookingTextInput
          id="rescue-vehiclePlate"
          value={values.vehiclePlate}
          onChange={(v) => onChange("vehiclePlate", v)}
          placeholder="51F-12345"
          autoComplete="off"
          error={errors.vehiclePlate}
          disabled={disabled}
        />
      </BookingField>
      <BookingField
        id="rescue-vehicleBrand"
        label="Hãng xe"
        error={errors.vehicleBrand}
      >
        <BookingTextInput
          id="rescue-vehicleBrand"
          value={values.vehicleBrand}
          onChange={(v) => onChange("vehicleBrand", v)}
          placeholder="Honda"
          autoComplete="off"
          error={errors.vehicleBrand}
          disabled={disabled}
        />
      </BookingField>
      <BookingField
        id="rescue-vehicleModel"
        label="Dòng xe"
        error={errors.vehicleModel}
      >
        <BookingTextInput
          id="rescue-vehicleModel"
          value={values.vehicleModel}
          onChange={(v) => onChange("vehicleModel", v)}
          placeholder="Wave Alpha"
          autoComplete="off"
          error={errors.vehicleModel}
          disabled={disabled}
        />
      </BookingField>
    </div>
  );
}
