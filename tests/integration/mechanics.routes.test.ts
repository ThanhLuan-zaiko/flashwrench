import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makePublicUser, readJsonBody } from "../helpers/auth.fixtures";
import {
  authorizationMocks,
  mechanicDirectoryServiceMocks,
  okMechanicDirectoryItem,
  resetRouteMocks,
  routeStubs,
} from "../helpers/route-mocks";

// Route suites stub every side effect: the auth guard and the directory
// service. The handler only parses query params, calls the service and
// shapes the response, so no database is touched here.
mock.module("@/lib/auth/authorization", () => authorizationMocks);
mock.module(
  "@/lib/mechanic/mechanic-directory.service",
  () => mechanicDirectoryServiceMocks,
);

import { GET as mechanicsGet } from "@/app/api/mechanics/route";

function getRequest(path: string): Request {
  return new Request(`http://localhost${path}`);
}

beforeEach(() => {
  resetRouteMocks();
});

describe("GET /api/mechanics", () => {
  test("returns 401 for guests", async () => {
    routeStubs.bookingUser = null;

    const res = await mechanicsGet(getRequest("/api/mechanics"));

    expect(res.status).toBe(401);
    expect(
      mechanicDirectoryServiceMocks.listAvailableMechanics.mock.calls.length,
    ).toBe(0);
  });

  test("returns the directory page with coordinates forwarded", async () => {
    routeStubs.bookingUser = makePublicUser();

    const res = await mechanicsGet(
      getRequest("/api/mechanics?lat=10.7769&lng=106.7009&limit=5"),
    );

    expect(res.status).toBe(200);
    expect(await readJsonBody(res)).toMatchObject({
      mechanics: [{ id: okMechanicDirectoryItem().id }],
    });
    expect(
      mechanicDirectoryServiceMocks.listAvailableMechanics.mock.calls[0],
    ).toEqual([{ lat: 10.7769, lng: 106.7009, limit: 5 }]);
  });

  test("passes service errors through with their status", async () => {
    routeStubs.bookingUser = makePublicUser();
    routeStubs.mechanicsList = {
      ok: false,
      status: 400,
      errors: { form: "Tọa độ tìm thợ không hợp lệ." },
    };

    const res = await mechanicsGet(getRequest("/api/mechanics?lat=abc"));

    expect(res.status).toBe(400);
    expect(await readJsonBody(res)).toMatchObject({
      errors: { form: "Tọa độ tìm thợ không hợp lệ." },
    });
  });
});
