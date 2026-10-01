import { FiUserPlus } from "react-icons/fi";
import type { BookingFieldErrors } from "@/services/booking.api";
import { BookingField, BookingTextInput } from "./BookingFormFields";

export type GuestSignupValues = {
  enabled: boolean;
  password: string;
  confirmPassword: string;
};

type BookingGuestSignupProps = {
  values: GuestSignupValues;
  errors: BookingFieldErrors;
  disabled?: boolean;
  onToggle: (enabled: boolean) => void;
  onPassword: (value: string) => void;
  onConfirmPassword: (value: string) => void;
};

// Guest fast-track signup: the contact trio above doubles as the account
// identity, so opting in only asks for a password. Unchecked, the booking
// stays a guest booking exactly like before.
export function BookingGuestSignup({
  values,
  errors,
  disabled,
  onToggle,
  onPassword,
  onConfirmPassword,
}: BookingGuestSignupProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-3 transition-colors duration-200 dark:border-zinc-800">
      <label className="flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={values.enabled}
          disabled={disabled}
          onChange={(event) => onToggle(event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-zinc-900 dark:accent-zinc-200"
        />
        <span className="flex flex-col gap-0.5">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            <FiUserPlus aria-hidden="true" className="h-3.5 w-3.5" />
            Tạo tài khoản luôn — chỉ cần thêm mật khẩu
          </span>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Đơn này và các đơn sau sẽ lưu vào lịch sử tài khoản của bạn.
          </span>
        </span>
      </label>
      {values.enabled && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <BookingField
            id="guestPassword"
            label="Mật khẩu"
            required
            error={errors.password}
            hint="Ít nhất 8 ký tự, gồm chữ và số."
          >
            <BookingTextInput
              id="guestPassword"
              type="password"
              value={values.password}
              onChange={onPassword}
              placeholder="Ít nhất 8 ký tự"
              autoComplete="new-password"
              error={errors.password}
              disabled={disabled}
            />
          </BookingField>
          <BookingField
            id="guestConfirmPassword"
            label="Nhập lại mật khẩu"
            required
            error={errors.confirmPassword}
          >
            <BookingTextInput
              id="guestConfirmPassword"
              type="password"
              value={values.confirmPassword}
              onChange={onConfirmPassword}
              placeholder="Nhập lại mật khẩu"
              autoComplete="new-password"
              error={errors.confirmPassword}
              disabled={disabled}
            />
          </BookingField>
        </div>
      )}
    </div>
  );
}
