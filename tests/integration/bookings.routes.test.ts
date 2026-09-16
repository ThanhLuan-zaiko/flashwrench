import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  invalidJsonRequest,
  makePublicUser,
  postJsonRequest,
  readJsonBody,
} from "../helpers/auth.fixtures";
import { makeBookingInput } from "../helpers/booking.fixtures";
import {
  authorizationMocks,
  bookingServiceMocks,
  okCreatedBooking,
  resetRouteMocks,
  routeStubs,
} from "../helpers/route-mocks";

// Route suites stub every side effect: the auth guard and the booking
// service. The handler only parses input, calls the service and shapes
// the response, so no database is touched here.
mock.module("@/lib/auth/authorization", () => authorizationMocks);
mock.module("@/lib/booking/booking.service", () => bookingServiceMocks);

import { POST as bookingsPost } from "@/app/api/bookings/route";

beforeEach(() => {
  resetRouteMocks();
});

describe("POST /api/bookings", () => {
  test("returns 401 without calling the service when logged out", async () => {
    routeStubs.bookingUser = null;

    const res = await bookingsPost(
      postJsonRequest("/api/bookings", makeBookingInput()),
    );

    expect(res.status).toBe(401);
    expect(await readJsonBody(res)).toMatchObject({
      errors: { form: "Vui lòng đăng nhập để tiếp tục." },
    });
    expect(bookingServiceMocks.createCustomerBooking.mock.calls.length).toBe(0);
  });

  test("returns 201 with the created booking on success", async () => {
    routeStubs.bookingUser = makePublicUser();
    const input = makeBookingInput();

    const res = await bookingsPost(postJsonRequest("/api/bookings", input));

    expect(res.status).toBe(201);
    expect(await readJsonBody(res)).toMatchObject({
      booking: { bookingId: okCreatedBooking().bookingId },
    });
    const [, passedInput] =
      bookingServiceMocks.createCustomerBooking.mock.calls[0] ?? [];
    expect(passedInput).toMatchObject({
      serviceId: input.serviceId,
      vehiclePlate: input.vehiclePlate,
    });
  });

  test("passes service errors through with their status", async () => {
    routeStubs.bookingUser = makePublicUser();
    routeStubs.bookingCreateResult = {
      ok: false,
      status: 404,
      errors: { form: "Dịch vụ này không còn khả dụng." },
    };

    const res = await bookingsPost(
      postJsonRequest("/api/bookings", makeBookingInput()),
    );

    expect(res.status).toBe(404);
    expect(await readJsonBody(res)).toMatchObject({
      errors: { form: "Dịch vụ này không còn khả dụng." },
    });
  });

  test("rejects malformed JSON with 400 without calling the service", async () => {
    routeStubs.bookingUser = makePublicUser();

    const res = await bookingsPost(invalidJsonRequest("/api/bookings"));

    expect(res.status).toBe(400);
    expect(bookingServiceMocks.createCustomerBooking.mock.calls.length).toBe(0);
  });
});
