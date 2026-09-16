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
  realtimePublishMocks,
  resetRouteMocks,
  routeStubs,
} from "../helpers/route-mocks";

// Route suites stub every side effect: the auth guard, the booking
// service and the realtime gateway. The handler only parses input,
// calls the service, shapes the response and fans the signal out.
mock.module("@/lib/auth/authorization", () => authorizationMocks);
mock.module("@/lib/booking/booking.service", () => bookingServiceMocks);
mock.module("@/lib/realtime/publish", () => realtimePublishMocks);

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

  test("publishes the booking topic and the mechanic inbox on success", async () => {
    routeStubs.bookingUser = makePublicUser();
    routeStubs.bookingCreateResult = {
      ok: true,
      data: {
        ...okCreatedBooking(),
        mechanicId: "mech-1",
        mechanicName: "Nguyen Van A",
      },
    };

    const res = await bookingsPost(
      postJsonRequest("/api/bookings", makeBookingInput()),
    );

    expect(res.status).toBe(201);
    const calls = realtimePublishMocks.publishRealtimeEvent.mock.calls;
    expect(calls).toContainEqual([
      "booking:99999999-9999-4999-8999-999999999999",
      {
        kind: "booking-created",
        bookingId: "99999999-9999-4999-8999-999999999999",
        status: "pending",
      },
    ]);
    expect(calls).toContainEqual([
      "user:mech-1",
      {
        kind: "booking-assigned",
        bookingId: "99999999-9999-4999-8999-999999999999",
        status: "pending",
      },
    ]);
  });

  test("publishes no inbox event for auto-dispatched bookings", async () => {
    routeStubs.bookingUser = makePublicUser();

    const res = await bookingsPost(
      postJsonRequest("/api/bookings", makeBookingInput()),
    );

    expect(res.status).toBe(201);
    const calls = realtimePublishMocks.publishRealtimeEvent.mock.calls;
    expect(calls).toHaveLength(1);
    expect(calls[0]?.[0]).toBe("booking:99999999-9999-4999-8999-999999999999");
  });

  test("publishes nothing when creation fails", async () => {
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
    expect(realtimePublishMocks.publishRealtimeEvent.mock.calls.length).toBe(0);
  });
});
