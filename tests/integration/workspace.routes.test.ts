import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  makePublicUser,
  postJsonRequest,
  readJsonBody,
} from "../helpers/auth.fixtures";
import {
  authorizationMocks,
  realtimePublishMocks,
  resetRouteMocks,
  routeStubs,
} from "../helpers/route-mocks";
import {
  dispatchServiceMocks,
  mechanicProfileRouteMocks,
  paymentRouteMocks,
  resetWorkspaceRouteMocks,
  vehicleServiceMocks,
} from "../helpers/workspace-route.mocks";

mock.module("@/lib/auth/authorization", () => authorizationMocks);
mock.module("@/lib/vehicles/vehicle.service", () => vehicleServiceMocks);
mock.module("@/lib/dispatch/dispatch.service", () => dispatchServiceMocks);
mock.module(
  "@/lib/mechanic/mechanic-profile.service",
  () => mechanicProfileRouteMocks,
);
mock.module("@/lib/payments/booking-payment.service", () => paymentRouteMocks);
mock.module("@/lib/realtime/publish", () => realtimePublishMocks);

import {
  GET as dispatchBookingGet,
  PATCH as dispatchBookingPatch,
} from "@/app/api/dispatch/bookings/[bookingId]/route";
import { GET as dispatchGet } from "@/app/api/dispatch/bookings/route";
import { POST as paymentPost } from "@/app/api/mechanic/bookings/[bookingId]/payment/route";
import {
  GET as profileGet,
  PATCH as profilePatch,
} from "@/app/api/mechanic/profile/route";
import { GET as vehicleHistoryGet } from "@/app/api/vehicles/[vehicleId]/history/route";
import {
  GET as vehicleGet,
  PATCH as vehiclePatch,
} from "@/app/api/vehicles/[vehicleId]/route";
import {
  GET as vehiclesGet,
  POST as vehiclesPost,
} from "@/app/api/vehicles/route";

const VEHICLE_ID = "dddddddd-2222-4222-8222-dddddddddddd";
const BOOKING_ID = "aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa";
const vehicleParams = Promise.resolve({ vehicleId: VEHICLE_ID });
const bookingParams = Promise.resolve({ bookingId: BOOKING_ID });

function patchJsonRequest(
  path: string,
  body: unknown,
  headers?: Record<string, string>,
): Request {
  return new Request(`http://localhost${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(headers ?? {}) },
    body: JSON.stringify(body),
  });
}

const FOREIGN_ORIGIN = { origin: "http://evil.example" };

beforeEach(() => {
  resetRouteMocks();
  resetWorkspaceRouteMocks();
});

describe("vehicle routes", () => {
  test("GET /api/vehicles returns 401 logged out, envelope when in", async () => {
    const denied = await vehiclesGet(
      new Request("http://localhost/api/vehicles"),
    );
    expect(denied.status).toBe(401);
    expect(vehicleServiceMocks.listVehicles.mock.calls.length).toBe(0);

    routeStubs.bookingUser = makePublicUser();
    const res = await vehiclesGet(
      new Request("http://localhost/api/vehicles?limit=10"),
    );
    expect(res.status).toBe(200);
    expect(await readJsonBody(res)).toMatchObject({
      items: [],
      nextCursor: null,
    });
  });

  test("POST /api/vehicles rejects a foreign origin before the service", async () => {
    routeStubs.bookingUser = makePublicUser();
    const res = await vehiclesPost(
      postJsonRequest(
        "/api/vehicles",
        { licensePlate: "51A12345" },
        FOREIGN_ORIGIN,
      ),
    );
    expect(res.status).toBe(403);
    expect(vehicleServiceMocks.createVehicle.mock.calls.length).toBe(0);
    expect(realtimePublishMocks.publishRealtimeEvent.mock.calls.length).toBe(0);
  });

  test("POST /api/vehicles publishes vehicle-updated on the owner inbox", async () => {
    const user = makePublicUser();
    routeStubs.bookingUser = user;
    const res = await vehiclesPost(
      postJsonRequest("/api/vehicles", { licensePlate: "51A12345" }),
    );
    expect(res.status).toBe(201);
    expect(realtimePublishMocks.publishRealtimeEvent.mock.calls[0]).toEqual([
      `user:${user.id}`,
      { kind: "vehicle-updated" },
    ]);
  });

  test("PATCH routes archive/restore vs edit to the right service call", async () => {
    routeStubs.bookingUser = makePublicUser();
    const path = `/api/vehicles/${VEHICLE_ID}`;

    const archive = await vehiclePatch(
      patchJsonRequest(path, { action: "archive" }),
      { params: vehicleParams },
    );
    expect(archive.status).toBe(200);
    expect(
      vehicleServiceMocks.setVehicleArchived.mock.calls[0]?.slice(0, 3),
    ).toEqual([routeStubs.bookingUser?.id, VEHICLE_ID, true]);

    const restore = await vehiclePatch(
      patchJsonRequest(path, { action: "restore" }),
      { params: vehicleParams },
    );
    expect(restore.status).toBe(200);
    expect(vehicleServiceMocks.setVehicleArchived.mock.calls[1]?.[2]).toBe(
      false,
    );

    const edit = await vehiclePatch(
      patchJsonRequest(path, { brand: "Honda" }),
      { params: vehicleParams },
    );
    expect(edit.status).toBe(200);
    expect(vehicleServiceMocks.updateVehicleDetails.mock.calls.length).toBe(1);

    const denied = await vehiclePatch(
      patchJsonRequest(path, { action: "archive" }, FOREIGN_ORIGIN),
      { params: vehicleParams },
    );
    expect(denied.status).toBe(403);
  });

  test("GET vehicle detail and history require auth", async () => {
    const detail = await vehicleGet(new Request("http://localhost/x"), {
      params: vehicleParams,
    });
    expect(detail.status).toBe(401);
    const history = await vehicleHistoryGet(new Request("http://localhost/x"), {
      params: vehicleParams,
    });
    expect(history.status).toBe(401);
    expect(vehicleServiceMocks.getVehicle.mock.calls.length).toBe(0);
    expect(vehicleServiceMocks.listVehicleHistory.mock.calls.length).toBe(0);
  });
});

describe("dispatch routes", () => {
  test("GET /api/dispatch/bookings rejects non-dispatch roles", async () => {
    routeStubs.bookingUser = makePublicUser({ role: "customer" });
    const res = await dispatchGet(
      new Request("http://localhost/api/dispatch/bookings"),
    );
    expect(res.status).toBe(403);
    expect(dispatchServiceMocks.listDispatchBookings.mock.calls.length).toBe(0);
  });

  test("GET /api/dispatch/bookings serves dispatchers and admins", async () => {
    routeStubs.bookingUser = makePublicUser({ role: "dispatcher" });
    const res = await dispatchGet(
      new Request("http://localhost/api/dispatch/bookings?status=pending"),
    );
    expect(res.status).toBe(200);
    expect(
      dispatchServiceMocks.listDispatchBookings.mock.calls[0]?.[1],
    ).toMatchObject({
      status: "pending",
    });
  });

  test("dispatch detail and PATCH enforce role and origin", async () => {
    routeStubs.bookingUser = makePublicUser({ role: "mechanic" });
    const deniedGet = await dispatchBookingGet(
      new Request("http://localhost/x"),
      { params: bookingParams },
    );
    expect(deniedGet.status).toBe(403);

    routeStubs.bookingUser = makePublicUser({ role: "dispatcher" });
    const csrf = await dispatchBookingPatch(
      patchJsonRequest("/x", { action: "confirm" }, FOREIGN_ORIGIN),
      { params: bookingParams },
    );
    expect(csrf.status).toBe(403);
    expect(dispatchServiceMocks.applyDispatchAction.mock.calls.length).toBe(0);

    const ok = await dispatchBookingPatch(
      patchJsonRequest("/x", {
        action: "confirm",
        expectedUpdatedAt: "2026-09-15T08:30:00.000Z",
      }),
      { params: bookingParams },
    );
    expect(ok.status).toBe(200);
    expect(dispatchServiceMocks.applyDispatchAction.mock.calls.length).toBe(1);
  });
});

describe("mechanic profile and payment routes", () => {
  test("GET /api/mechanic/profile is mechanic-only", async () => {
    routeStubs.bookingUser = makePublicUser({ role: "customer" });
    expect((await profileGet()).status).toBe(403);
    routeStubs.bookingUser = makePublicUser({ role: "admin" });
    expect((await profileGet()).status).toBe(403);
    routeStubs.bookingUser = makePublicUser({ role: "mechanic" });
    expect((await profileGet()).status).toBe(200);
    expect(
      mechanicProfileRouteMocks.getMechanicPresence.mock.calls.length,
    ).toBe(1);
  });

  test("PATCH /api/mechanic/profile rejects foreign origin first", async () => {
    routeStubs.bookingUser = makePublicUser({ role: "mechanic" });
    const denied = await profilePatch(
      patchJsonRequest("/x", { online: true }, FOREIGN_ORIGIN),
    );
    expect(denied.status).toBe(403);
    expect(
      mechanicProfileRouteMocks.updateMechanicProfilePresence.mock.calls.length,
    ).toBe(0);
    const ok = await profilePatch(patchJsonRequest("/x", { online: true }));
    expect(ok.status).toBe(200);
  });

  test("POST payment allows mechanic/admin and rejects others + CSRF", async () => {
    routeStubs.bookingUser = makePublicUser({ role: "dispatcher" });
    const denied = await paymentPost(
      postJsonRequest("/x", { method: "cod", confirmed: true }),
      { params: bookingParams },
    );
    expect(denied.status).toBe(403);

    routeStubs.bookingUser = makePublicUser({ role: "mechanic" });
    const csrf = await paymentPost(
      postJsonRequest("/x", { method: "cod", confirmed: true }, FOREIGN_ORIGIN),
      { params: bookingParams },
    );
    expect(csrf.status).toBe(403);
    expect(paymentRouteMocks.recordBookingPayment.mock.calls.length).toBe(0);

    const ok = await paymentPost(
      postJsonRequest("/x", { method: "cod", confirmed: true }),
      { params: bookingParams },
    );
    expect(ok.status).toBe(201);
    expect(await readJsonBody(ok)).toMatchObject({
      payment: { method: "cod" },
    });
  });
});
