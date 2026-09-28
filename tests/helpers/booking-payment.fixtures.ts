// Shared actors + request bodies for the booking-payment suites. The
// confirm-code guard lives in payment-code.service, so every cash request
// needs the issued code echoed back — keep the fixture in one place.
import { makePublicUser } from "./auth.fixtures";
import { CUSTOMER_ID, MECHANIC_ID, makeBookingRow } from "./mechanic.fixtures";

export const CONFIRM_CODE = "654321";

export const paymentMechanic = makePublicUser({
  id: MECHANIC_ID,
  role: "mechanic",
});
export const paymentAdmin = makePublicUser({
  id: "eeeeeeee-3333-4333-8333-eeeeeeeeeeee",
  role: "admin",
});
export const paymentCustomer = makePublicUser({
  id: CUSTOMER_ID,
  role: "customer",
});

export function completedBooking(
  overrides?: Parameters<typeof makeBookingRow>[0],
) {
  return makeBookingRow({
    status: "completed",
    payment_confirm_code: CONFIRM_CODE,
    ...overrides,
  });
}

export function paymentBody(overrides?: Record<string, unknown>) {
  return {
    method: "cod",
    confirmed: true,
    amount: 450000,
    confirmCode: CONFIRM_CODE,
    ...overrides,
  };
}
