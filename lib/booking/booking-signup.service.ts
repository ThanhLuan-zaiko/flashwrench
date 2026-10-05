// Guest "book now, sign up in the same submit": the contact trio the
// form already collected becomes the account identity, only the password
// is new. Ordering matters — the booking input is validated before any
// account write so a broken form never creates a dangling user, and the
// booking then lands directly on the fresh account (no claim pass needed
// for it: registerUser's built-in claim already swept up older guest
// records under the same phone+email).
import { registerUser } from "@/lib/auth/auth.service";
import type { PublicUser, SessionTokens } from "@/lib/auth/user.types";
import {
  getBusinessHoursPolicy,
  openWindowOf,
} from "@/lib/shop/business-hours.service";
import { createCustomerBooking } from "./booking.service";
import type {
  BookingResult,
  CreateBookingInput,
  CreatedBooking,
} from "./booking.types";
import { validateCreateBookingInput } from "./booking.validation";
import { getBookingPolicy } from "./booking-config.service";

export type GuestBookingSignup = {
  booking: CreatedBooking;
  user: PublicUser;
  tokens: SessionTokens;
};

export async function createGuestBookingWithAccount(
  raw: CreateBookingInput,
  label: string,
): Promise<BookingResult<GuestBookingSignup>> {
  const policy = await getBookingPolicy();
  // This path is a guest submitting with a signup checkbox — when guest
  // intake is off, fail before registerUser mints a dangling account.
  if (!policy.guestBookingEnabled) {
    return {
      ok: false,
      status: 403,
      errors: {
        form: "Cửa hàng hiện chỉ nhận đặt lịch sau khi đăng nhập. Vui lòng đăng nhập rồi đặt lại.",
      },
    };
  }
  const hours = await getBusinessHoursPolicy();
  const checked = validateCreateBookingInput(raw, {
    guest: true,
    minLeadDays: policy.minLeadDays,
    maxAdvanceDays: policy.maxAdvanceDays,
    openWindow: openWindowOf(hours),
  });
  if ("errors" in checked) {
    return { ok: false, status: 400, errors: checked.errors };
  }
  const value = checked.value;

  const registered = await registerUser(
    {
      fullName: value.fullName ?? "",
      phone: value.phone ?? "",
      email: value.email ?? "",
      password: raw.password ?? "",
      confirmPassword: raw.confirmPassword ?? "",
    },
    label,
  );
  if (!registered.ok) {
    return { ok: false, status: registered.status, errors: registered.errors };
  }

  const booked = await createCustomerBooking(registered.user, raw);
  if (!booked.ok) {
    // The account exists already — surface the booking errors as-is so
    // the form can fix and resubmit (the retry then goes through the
    // plain logged-in booking path).
    return booked;
  }
  return {
    ok: true,
    data: {
      booking: booked.data,
      user: registered.user,
      tokens: registered.tokens,
    },
  };
}
