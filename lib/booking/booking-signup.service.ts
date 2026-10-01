// Guest "book now, sign up in the same submit": the contact trio the
// form already collected becomes the account identity, only the password
// is new. Ordering matters — the booking input is validated before any
// account write so a broken form never creates a dangling user, and the
// booking then lands directly on the fresh account (no claim pass needed
// for it: registerUser's built-in claim already swept up older guest
// records under the same phone+email).
import { registerUser } from "@/lib/auth/auth.service";
import type { PublicUser, SessionTokens } from "@/lib/auth/user.types";
import { createCustomerBooking } from "./booking.service";
import type {
  BookingResult,
  CreateBookingInput,
  CreatedBooking,
} from "./booking.types";
import { validateCreateBookingInput } from "./booking.validation";

export type GuestBookingSignup = {
  booking: CreatedBooking;
  user: PublicUser;
  tokens: SessionTokens;
};

export async function createGuestBookingWithAccount(
  raw: CreateBookingInput,
  label: string,
): Promise<BookingResult<GuestBookingSignup>> {
  const checked = validateCreateBookingInput(raw, { guest: true });
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
