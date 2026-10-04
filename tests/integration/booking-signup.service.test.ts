import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makeBookingInput } from "../helpers/booking.fixtures";
import { okAuthResult, okCreatedBooking } from "../helpers/route.fixtures";
import {
  authServiceMocks,
  bookingServiceMocks,
  resetRouteMocks,
  routeStubs,
} from "../helpers/route-mocks";

// Inline-signup orchestration suite: the booking input is validated before
// any account write, registerUser consumes the contact trio + password,
// and the booking lands on the fresh user. Both domain services are
// stubbed — this file guards the wiring, not their internals.
mock.module("@/lib/auth/auth.service", () => authServiceMocks);
mock.module("@/lib/booking/booking.service", () => bookingServiceMocks);

import { createGuestBookingWithAccount } from "@/lib/booking/booking-signup.service";

const GUEST_CONTACT = {
  fullName: "Tran Thi Be",
  phone: "0909999888",
  email: "Be@Example.com",
};

function signupInput(overrides?: Record<string, unknown>) {
  return {
    ...makeBookingInput(GUEST_CONTACT),
    createAccount: true,
    password: "secret123",
    confirmPassword: "secret123",
    ...overrides,
  };
}

beforeEach(() => {
  resetRouteMocks();
});

describe("createGuestBookingWithAccount", () => {
  test("validates the booking before touching the account path", async () => {
    const result = await createGuestBookingWithAccount(
      signupInput({ serviceId: "" }),
      "device",
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(result.errors.serviceId).toBeTruthy();
    expect(authServiceMocks.registerUser).not.toHaveBeenCalled();
    expect(bookingServiceMocks.createCustomerBooking).not.toHaveBeenCalled();
  });

  test("validates the password pair through the booking errors shape", async () => {
    const result = await createGuestBookingWithAccount(
      signupInput({ password: "short", confirmPassword: "different" }),
      "device",
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.password).toBeTruthy();
    expect(result.errors.confirmPassword).toBeTruthy();
    expect(authServiceMocks.registerUser).not.toHaveBeenCalled();
  });

  test("registers with the normalized contact trio, then books as the user", async () => {
    const auth = okAuthResult();
    routeStubs.registerResult = auth;

    const result = await createGuestBookingWithAccount(signupInput(), "device");

    expect(result.ok).toBe(true);
    if (!auth.ok) return;
    const registerCall = authServiceMocks.registerUser.mock.calls[0];
    expect(registerCall?.[0]).toMatchObject({
      fullName: "Tran Thi Be",
      phone: "0909999888",
      email: "be@example.com",
      password: "secret123",
      confirmPassword: "secret123",
    });
    const bookingCall = bookingServiceMocks.createCustomerBooking.mock.calls[0];
    expect(bookingCall?.[0]).toMatchObject({ id: auth.user.id });
    if (!result.ok) return;
    expect(result.data.user).toEqual(auth.user);
    expect(result.data.tokens).toEqual(auth.tokens);
    expect(result.data.booking.bookingId).toBe(okCreatedBooking().bookingId);
  });

  test("keeps the complete bundle and quote during inline signup", async () => {
    const ids = [
      "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    ];
    const result = await createGuestBookingWithAccount(
      signupInput({
        serviceId: undefined,
        serviceIds: ids,
        expectedSubtotal: 300000,
      }),
      "device",
    );
    expect(result.ok).toBe(true);
    expect(authServiceMocks.registerUser).toHaveBeenCalledTimes(1);
    expect(bookingServiceMocks.createCustomerBooking).toHaveBeenCalledTimes(1);
    expect(
      bookingServiceMocks.createCustomerBooking.mock.calls[0]?.[1],
    ).toMatchObject({ serviceIds: ids, expectedSubtotal: 300000 });
  });

  test("surfaces register conflicts without creating a booking", async () => {
    routeStubs.registerResult = {
      ok: false,
      status: 409,
      errors: {
        phone: "Số điện thoại này đã được đăng ký.",
        form: "Thông tin này đã tồn tại. Vui lòng đăng nhập.",
      },
    };

    const result = await createGuestBookingWithAccount(signupInput(), "device");

    expect(result).toMatchObject({ ok: false, status: 409 });
    if (result.ok) return;
    expect(result.errors.phone).toBeTruthy();
    expect(bookingServiceMocks.createCustomerBooking).not.toHaveBeenCalled();
  });

  test("returns booking errors when the booking fails after signup", async () => {
    routeStubs.bookingCreateResult = {
      ok: false,
      status: 409,
      errors: { form: "Thợ đã chọn hiện đang bận. Vui lòng chọn thợ khác." },
    };

    const result = await createGuestBookingWithAccount(signupInput(), "device");

    expect(result).toMatchObject({ ok: false, status: 409 });
    if (result.ok) return;
    expect(result.errors.form).toContain("Thợ đã chọn");
  });
});
