import { beforeEach, describe, expect, mock, test } from "bun:test";
import { ACCESS_COOKIE } from "@/lib/auth/session";
import { makePublicUser } from "../helpers/auth.fixtures";
import {
  adminUsersRouteMocks,
  authServiceMocks,
  nextHeadersMocks,
  realtimePublishMocks,
  resetRouteMocks,
  routeStubs,
  setMockCookies,
} from "../helpers/route-mocks";

// Route-level suite for the admin account actions: the guard is real, the
// service and the realtime publisher are stubbed, so the assertions are
// "which action reached the service" and "which notice left the server".
mock.module("@/lib/auth/auth.service", () => authServiceMocks);
mock.module("@/lib/auth/admin-users.service", () => adminUsersRouteMocks);
mock.module("@/lib/realtime/publish", () => realtimePublishMocks);
mock.module("next/headers", () => nextHeadersMocks);

import { PATCH } from "@/app/api/admin/users/[userId]/route";

const params = Promise.resolve({ userId: "target-1" });

function adminContext(): void {
  routeStubs.meUser = makePublicUser({ id: "admin-1", role: "admin" });
  setMockCookies({ [ACCESS_COOKIE]: "admin-token" });
}

function patchRequest(body: unknown): Request {
  return new Request("http://localhost/api/admin/users/target-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  resetRouteMocks();
  setMockCookies({});
});

describe("PATCH /api/admin/users/[userId]", () => {
  test("publishes the forced-logout notice on the locked account inbox", async () => {
    adminContext();
    const res = await PATCH(patchRequest({ action: "lock" }), { params });

    expect(res.status).toBe(200);
    expect(adminUsersRouteMocks.applyAdminUserAction.mock.calls[0]).toEqual([
      "admin-1",
      "target-1",
      "lock",
    ]);
    expect(realtimePublishMocks.publishRealtimeEvent.mock.calls[0]).toEqual([
      "user:target-1",
      { kind: "locked" },
    ]);
  });

  test("stays silent for approve and unlock", async () => {
    adminContext();
    await PATCH(patchRequest({ action: "approve" }), { params });
    await PATCH(patchRequest({ action: "unlock" }), { params });

    expect(adminUsersRouteMocks.applyAdminUserAction.mock.calls.length).toBe(2);
    expect(realtimePublishMocks.publishRealtimeEvent.mock.calls.length).toBe(0);
  });

  test("passes rejected actions through without publishing", async () => {
    adminContext();
    routeStubs.adminActionResult = {
      ok: false,
      status: 403,
      errors: {
        form: "Không thể thay đổi trạng thái tài khoản quản trị viên khác.",
      },
    };
    const res = await PATCH(patchRequest({ action: "lock" }), { params });

    expect(res.status).toBe(403);
    expect(realtimePublishMocks.publishRealtimeEvent.mock.calls.length).toBe(0);
  });

  test("rejects malformed JSON without calling the service", async () => {
    adminContext();
    const res = await PATCH(patchRequest("{not-json"), { params });

    expect(res.status).toBe(400);
    expect(adminUsersRouteMocks.applyAdminUserAction.mock.calls.length).toBe(0);
  });

  test("requires an admin session", async () => {
    routeStubs.meUser = makePublicUser({ id: "cust-1", role: "customer" });
    setMockCookies({ [ACCESS_COOKIE]: "customer-token" });
    const res = await PATCH(patchRequest({ action: "lock" }), { params });

    expect(res.status).toBe(403);
    expect(adminUsersRouteMocks.applyAdminUserAction.mock.calls.length).toBe(0);
  });

  test("rejects anonymous callers", async () => {
    const res = await PATCH(patchRequest({ action: "lock" }), { params });

    expect(res.status).toBe(401);
    expect(adminUsersRouteMocks.applyAdminUserAction.mock.calls.length).toBe(0);
  });
});
