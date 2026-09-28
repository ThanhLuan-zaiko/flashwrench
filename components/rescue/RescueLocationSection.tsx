import type { RescueFieldErrors } from "@/services/rescue.api";
import {
  BookingField,
  BookingTextArea,
  BookingTextInput,
} from "../booking/BookingFormFields";
import type { RescueAddressValues } from "./rescue-form-state";

type RescueLocationSectionProps = {
  values: RescueAddressValues;
  errors: RescueFieldErrors;
  disabled: boolean;
  onChange: (field: keyof RescueAddressValues, value: string) => void;
};

// Breakdown address: one required full address plus optional parts
// stored on the rescue address block for dispatch.
export function RescueLocationSection({
  values,
  errors,
  disabled,
  onChange,
}: RescueLocationSectionProps) {
  return (
    <div className="flex flex-col gap-4">
      <BookingField
        id="rescue-address"
        label="Vị trí xe đang dừng"
        required
        error={errors.address}
        hint="Số nhà, đường, mốc dễ thấy để thợ tìm đúng chỗ."
      >
        <BookingTextArea
          id="rescue-address"
          value={values.address}
          onChange={(v) => onChange("address", v)}
          placeholder="Ví dụ: trước số 123 Nguyễn Trãi, Quận 3, TP Hồ Chí Minh"
          error={errors.address}
          disabled={disabled}
        />
      </BookingField>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <BookingField
          id="rescue-province"
          label="Tỉnh/Thành phố"
          error={errors.province}
        >
          <BookingTextInput
            id="rescue-province"
            value={values.province}
            onChange={(v) => onChange("province", v)}
            placeholder="TP Hồ Chí Minh"
            error={errors.province}
            disabled={disabled}
          />
        </BookingField>
        <BookingField
          id="rescue-district"
          label="Quận/Huyện"
          error={errors.district}
        >
          <BookingTextInput
            id="rescue-district"
            value={values.district}
            onChange={(v) => onChange("district", v)}
            placeholder="Quận 3"
            error={errors.district}
            disabled={disabled}
          />
        </BookingField>
        <BookingField id="rescue-ward" label="Phường/Xã" error={errors.ward}>
          <BookingTextInput
            id="rescue-ward"
            value={values.ward}
            onChange={(v) => onChange("ward", v)}
            placeholder="Phường 5"
            error={errors.ward}
            disabled={disabled}
          />
        </BookingField>
        <BookingField
          id="rescue-street"
          label="Số nhà/Đường"
          error={errors.street}
        >
          <BookingTextInput
            id="rescue-street"
            value={values.street}
            onChange={(v) => onChange("street", v)}
            placeholder="123 Nguyễn Trãi"
            error={errors.street}
            disabled={disabled}
          />
        </BookingField>
      </div>
    </div>
  );
}
