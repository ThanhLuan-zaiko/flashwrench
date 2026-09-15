import { beforeEach, describe, expect, mock, test } from "bun:test";
import { ACCESS_COOKIE } from "@/lib/auth/session";
import {
  makePublicUser,
  postJsonRequest,
  readJsonBody,
} from "../helpers/auth.fixtures";
import {
  authServiceMocks,
  nextHeadersMocks,
  realtimePublishMocks,
  resetRouteMocks,
  routeStubs,
  setMockCookies,
  staffCryptoRouteMocks,
  staffPendingRouteMocks,
  staffResetRouteMocks,
} from "../helpers/route-mocks";

// Route suites stub every side effect: auth, services and `next/headers`.
mock.module("@/lib/auth/auth.service", () => authServiceMocks);
mock.module("next/headers", () => nextHeadersMocks);
mock.module("@/lib/auth/staff-pending.service", () => staffPendingRouteMocks);
mock.module(
  "@/lib/auth/staff-password-reset.service",
  () => staffResetRouteMocks,
);
mock.module("@/lib/auth/staff-temp-crypto", () => staffCryptoRouteMocks);
mock.module("@/lib/realtime/publish", () => realtimePublishMocks);

import { POST as resetPost } from "@/app/api/admin/users/[userId]/route";
import { POST as pendingPost } from "@/app/api/admin/users/pending-passwords/route";

const ADMIN_COOKIES = { [ACCESS_COOKIE]: "admin-token" };

function adminContext() {
  routeStubs.meUser = makePublicUser({ id: "admin-1", role: "admin" });
  setMockCookies(ADMIN_COOKIES);
}

beforeEach(() => {
  resetRouteMocks();
  setMockCookies({});
});

describe("POST /api/admin/users/pending-passwords", () => {
  test("returns decrypted items for the requested ids", async () => {
    adminContext();
    routeStubs.pendingPasswordItems = [
      { userId: "u1", tempPassword: "Abc123XyZ9", createdAt: null },
    ];
    const res = await pendingPost(
      postJsonRequest("/api/admin/users/pending-passwords", {
        userIds: ["u1", "u2"],
      }),
    );
    expect(res.status).toBe(200);
    expect(await readJsonBody(res)).toMatchObject({
      items: [{ userId: "u1", tempPassword: "Abc123XyZ9" }],
      cryptoConfigured: true,
    });
    expect(
      staffPendingRouteMocks.listPendingTempPasswords.mock.calls[0]?.[0],
    ).toEqual(["u1", "u2"]);
  });

  test("rejects non-array bodies without calling the service", async () => {
    adminContext();
    const res = await pendingPost(
      postJsonRequest("/api/admin/users/pending-passwords", { userIds: "u1" }),
    );
    expect(res.status).toBe(400);
    expect(
      staffPendingRouteMocks.listPendingTempPasswords.mock.calls.length,
    ).toBe(0);
  });

  test("requires an admin session", async () => {
    const res = await pendingPost(
      postJsonRequest("/api/admin/users/pending-passwords", { userIds: [] }),
    );
    expect(res.status).toBe(401);
    expect(
      staffPendingRouteMocks.listPendingTempPasswords.mock.calls.length,
    ).toBe(0);
  });
});

describe("POST /api/admin/users/[userId] (reset temp password)", () => {
  const params = Promise.resolve({ userId: "u1" });

  test("issues a fresh temp password with 201 and broadcasts", async () => {
    adminContext();
    const res = await resetPost(
      new Request("http://localhost/api/admin/users/u1", { method: "POST" }),
      { params },
    );
    expect(res.status).toBe(201);
    expect(await readJsonBody(res)).toMatchObject({
      tempPassword: "Abc123XyZ9",
    });
    expect(staffResetRouteMocks.resetStaffTempPassword.mock.calls[0]).toEqual([
      "admin-1",
      "u1",
    ]);
    expect(realtimePublishMocks.publishRealtimeEvent.mock.calls.length).toBe(1);
  });

  test("passes service errors through and skips broadcast", async () => {
    adminContext();
    routeStubs.resetStaffResult = {
      ok: false,
      status: 404,
      errors: { form: "Không tìm thấy người dùng." },
    };
    const res = await resetPost(
      new Request("http://localhost/api/admin/users/u1", { method: "POST" }),
      { params },
    );
    expect(res.status).toBe(404);
    expect(realtimePublishMocks.publishRealtimeEvent.mock.calls.length).toBe(0);
  });

  test("requires an admin session", async () => {
    const res = await resetPost(
      new Request("http://localhost/api/admin/users/u1", { method: "POST" }),
      { params },
    );
    expect(res.status).toBe(401);
    expect(staffResetRouteMocks.resetStaffTempPassword.mock.calls.length).toBe(
      0,
    );
  });
});
