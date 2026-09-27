import type { RescueFieldErrors } from "@/services/rescue.api";
import { BookingField, BookingTextInput } from "../booking/BookingFormFields";

type RescueContactSectionProps = {
  fullName: string;
  phone: string;
  errors: RescueFieldErrors;
  disabled: boolean;
  onFullName: (value: string) => void;
  onPhone: (value: string) => void;
};

// Contact step: guests file without an account, so name + phone are
// required on every rescue. Logged-in users still confirm the number
// the mechanic should call.
export function RescueContactSection({
  fullName,
  phone,
  errors,
  disabled,
  onFullName,
  onPhone,
}: RescueContactSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <BookingField
        id="rescue-fullName"
        label="Họ và tên"
        required
        error={errors.fullName}
        hint="Tên người đang ở cùng xe."
      >
        <BookingTextInput
          id="rescue-fullName"
          value={fullName}
          onChange={onFullName}
          placeholder="Nguyễn Văn An"
          autoComplete="name"
          error={errors.fullName}
          disabled={disabled}
        />
      </BookingField>
      <BookingField
        id="rescue-phone"
        label="Số điện thoại"
        required
        error={errors.phone}
        hint="Thợ gọi lại số này ngay sau khi nhận yêu cầu."
      >
        <BookingTextInput
          id="rescue-phone"
          value={phone}
          onChange={onPhone}
          placeholder="0912345678"
          autoComplete="tel"
          inputMode="tel"
          error={errors.phone}
          disabled={disabled}
        />
      </BookingField>
    </div>
  );
}
