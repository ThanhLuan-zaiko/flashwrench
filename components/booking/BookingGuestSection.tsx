"use client";

import { BookingGuestContact } from "./BookingGuestContact";
import { BookingGuestSignup } from "./BookingGuestSignup";
import type { useBookingForm } from "./useBookingForm";

type GuestFormState = Pick<
  ReturnType<typeof useBookingForm>,
  | "contact"
  | "setContact"
  | "signup"
  | "setSignup"
  | "errors"
  | "pending"
  | "clearError"
>;

export function BookingGuestSection({ form }: { form: GuestFormState }) {
  const {
    contact,
    setContact,
    signup,
    setSignup,
    errors,
    pending,
    clearError,
  } = form;
  return (
    <div className="flex flex-col gap-4 lg:col-start-2">
      <BookingGuestContact
        values={contact}
        errors={errors}
        disabled={pending}
        emailHint={
          signup.enabled
            ? "Cũng là email đăng nhập cho tài khoản mới."
            : undefined
        }
        onChange={(field, value) => {
          setContact((previous) => ({ ...previous, [field]: value }));
          clearError(field);
        }}
      />
      <BookingGuestSignup
        values={signup}
        errors={errors}
        disabled={pending}
        onToggle={(enabled) => {
          setSignup((previous) => ({ ...previous, enabled }));
          clearError("password");
          clearError("confirmPassword");
        }}
        onPassword={(value) => {
          setSignup((previous) => ({ ...previous, password: value }));
          clearError("password");
        }}
        onConfirmPassword={(value) => {
          setSignup((previous) => ({ ...previous, confirmPassword: value }));
          clearError("confirmPassword");
        }}
      />
    </div>
  );
}
