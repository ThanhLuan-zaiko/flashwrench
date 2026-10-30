import type { BookingFieldErrors } from "@/services/booking.api";
import { BookingField, BookingTextInput } from "./BookingFormFields";

export type AddressValues = {
  address: string;
  province: string;
  district: string;
  ward: string;
  street: string;
};

type BookingAddressSectionProps = {
  values: AddressValues;
  errors: BookingFieldErrors;
  disabled?: boolean;
  onChange: (field: keyof AddressValues, value: string) => void;
};

// Location step: one required full address plus optional structured
// parts stored on the booking address UDT for dispatch.
export function BookingAddressSection({
  values,
  errors,
  disabled,
  onChange,
}: BookingAddressSectionProps) {
  return (
    <div className="flex flex-col gap-3">
      <BookingField
        id="address"
        label="Địa chỉ chi tiết"
        required
        error={errors.address}
      >
        <BookingTextInput
          id="address"
          value={values.address}
          onChange={(v) => onChange("address", v)}
          placeholder="Ví dụ: 12 Nguyễn Hữu Thọ, Quận 7"
          error={errors.address}
          disabled={disabled}
        />
      </BookingField>
      {/* Optional structured parts: the map fills them, so they stay
      collapsed unless one of them carries an error. */}
      <details
        open={Boolean(
          errors.province || errors.district || errors.ward || errors.street,
        )}
        className="group"
      >
        <summary className="flex min-h-9 cursor-pointer list-none items-center text-xs font-semibold text-zinc-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 dark:text-zinc-300">
          Chi tiết địa chỉ (không bắt buộc)
        </summary>
        <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
          <BookingField
            id="province"
            label="Tỉnh/Thành phố"
            error={errors.province}
          >
            <BookingTextInput
              id="province"
              value={values.province}
              onChange={(v) => onChange("province", v)}
              placeholder="TP Hồ Chí Minh"
              error={errors.province}
              disabled={disabled}
            />
          </BookingField>
          <BookingField
            id="district"
            label="Quận/Huyện"
            error={errors.district}
          >
            <BookingTextInput
              id="district"
              value={values.district}
              onChange={(v) => onChange("district", v)}
              placeholder="Quận 3"
              error={errors.district}
              disabled={disabled}
            />
          </BookingField>
          <BookingField id="ward" label="Phường/Xã" error={errors.ward}>
            <BookingTextInput
              id="ward"
              value={values.ward}
              onChange={(v) => onChange("ward", v)}
              placeholder="Phường 5"
              error={errors.ward}
              disabled={disabled}
            />
          </BookingField>
          <BookingField id="street" label="Số nhà/Đường" error={errors.street}>
            <BookingTextInput
              id="street"
              value={values.street}
              onChange={(v) => onChange("street", v)}
              placeholder="123 Nguyễn Trãi"
              error={errors.street}
              disabled={disabled}
            />
          </BookingField>
        </div>
      </details>
    </div>
  );
}
