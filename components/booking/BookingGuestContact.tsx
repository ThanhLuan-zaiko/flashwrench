import type { BookingFieldErrors } from "@/services/booking.api";
import { BookingField, BookingTextInput } from "./BookingFormFields";

export type GuestContactValues = {
  fullName: string;
  phone: string;
  email: string;
};

type BookingGuestContactProps = {
  values: GuestContactValues;
  errors: BookingFieldErrors;
  disabled?: boolean;
  // Overrides the default "no account" hint while inline signup is on —
  // the email then doubles as the new account's login.
  emailHint?: string;
  onChange: (field: keyof GuestContactValues, value: string) => void;
};

// Guest-only block: the contact trio is the reach-back channel staff
// use for a session-less booking, so all three fields are required.
export function BookingGuestContact({
  values,
  errors,
  disabled,
  emailHint,
  onChange,
}: BookingGuestContactProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <BookingField
          id="guestFullName"
          label="Họ và tên"
          required
          error={errors.fullName}
        >
          <BookingTextInput
            id="guestFullName"
            value={values.fullName}
            onChange={(v) => onChange("fullName", v)}
            placeholder="Nguyễn Văn A"
            autoComplete="name"
            error={errors.fullName}
            disabled={disabled}
          />
        </BookingField>
        <BookingField
          id="guestPhone"
          label="Số điện thoại"
          required
          error={errors.phone}
        >
          <BookingTextInput
            id="guestPhone"
            value={values.phone}
            onChange={(v) => onChange("phone", v)}
            placeholder="0901234567"
            autoComplete="tel"
            inputMode="tel"
            error={errors.phone}
            disabled={disabled}
          />
        </BookingField>
      </div>
      <BookingField
        id="guestEmail"
        label="Email"
        required
        error={errors.email}
        hint={
          emailHint ?? "Chỉ dùng để liên hệ về đơn này — không tạo tài khoản."
        }
      >
        <BookingTextInput
          id="guestEmail"
          value={values.email}
          onChange={(v) => onChange("email", v)}
          placeholder="ban@example.com"
          autoComplete="email"
          inputMode="text"
          error={errors.email}
          disabled={disabled}
        />
      </BookingField>
    </div>
  );
}
