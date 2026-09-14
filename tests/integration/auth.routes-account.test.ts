import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  ACCESS_COOKIE,
  createRefreshToken,
  REFRESH_COOKIE,
} from "@/lib/auth/session";
import {
  getResponseCookie,
  makePublicUser,
  postJsonRequest,
  readJsonBody,
} from "../helpers/auth.fixtures";
import {
  authServiceMocks,
  guardMocks,
  nextHeadersMocks,
  passwordChangeMocks,
  resetRouteMocks,
  routeStubs,
  setMockCookies,
  userSessionMocks,
} from "../helpers/route-mocks";

// Companion to `auth.routes.test.ts`: session lifecycle and account routes.
// New endpoints get their own describe block here following the same stub
// pattern (`routeStubs` in, status/body/cookies out).
mock.module("@/lib/auth/guards", () => guardMocks);
mock.module("@/lib/auth/auth.service", () => authServiceMocks);
mock.module("@/lib/auth/password-change.service", () => passwordChangeMocks);
mock.module("@/lib/auth/user-sessions", () => userSessionMocks);
mock.module("next/headers", () => nextHeadersMocks);

import { POST as changePasswordPost } from "@/app/api/auth/change-password/route";
import { POST as logoutPost } from "@/app/api/auth/logout/route";
import { POST as logoutAllPost } from "@/app/api/auth/logout-all/route";
import { POST as refreshPost } from "@/app/api/auth/refresh/route";
import { DELETE as sessionDelete } from "@/app/api/auth/sessions/[familyId]/route";
import { GET as sessionsGet } from "@/app/api/auth/sessions/route";

function refreshRequest(): Request {
  return new Request("http://localhost/api/auth/refresh", { method: "POST" });
}

beforeEach(() => {
  resetRouteMocks();
  setMockCookies({});
});

describe("POST /api/auth/refresh", () => {
  test("rejects requests without a refresh cookie", async () => {
    const res = await refreshPost(refreshRequest());
    expect(res.status).toBe(401);
  });

  test("rotates cookies on success", async () => {
    setMockCookies({ [REFRESH_COOKIE]: "refresh-1" });
    const res = await refreshPost(refreshRequest());
    expect(res.status).toBe(200);
    expect(getResponseCookie(res, ACCESS_COOKIE)).toBe("access-token");
    expect(getResponseCookie(res, REFRESH_COOKIE)).toBe(
      "fw1.cGF5bG9hZA.c2VjcmV0",
    );
  });

  test("clears cookies when the family is revoked", async () => {
    routeStubs.refreshOutcome = { ok: false, revoked: true };
    setMockCookies({ [REFRESH_COOKIE]: "stolen" });
    const res = await refreshPost(refreshRequest());
    expect(res.status).toBe(401);
    expect(getResponseCookie(res, ACCESS_COOKIE)).toBe("");
  });
});

describe("POST /api/auth/logout", () => {
  test("revokes the current family and always succeeds", async () => {
    const created = createRefreshToken("user-1", "family-1");
    setMockCookies({ [REFRESH_COOKIE]: created.token });
    const res = await logoutPost();
    expect(res.status).toBe(200);
    expect(await readJsonBody(res)).toEqual({ ok: true });
    expect(authServiceMocks.revokeSession.mock.calls[0]).toEqual([
      "user-1",
      "family-1",
    ]);
  });

  test("succeeds even without any cookie", async () => {
    const res = await logoutPost();
    expect(await readJsonBody(res)).toEqual({ ok: true });
    expect(authServiceMocks.revokeSession.mock.calls.length).toBe(0);
  });
});

describe("POST /api/auth/logout-all", () => {
  test("revokes every session for the authenticated user", async () => {
    routeStubs.meUser = makePublicUser();
    setMockCookies({ [ACCESS_COOKIE]: "access-1" });
    const res = await logoutAllPost();
    expect(await readJsonBody(res)).toEqual({ ok: true });
    expect(authServiceMocks.revokeAllSessions.mock.calls.length).toBe(1);
  });
});

describe("GET /api/auth/sessions", () => {
  test("requires authentication", async () => {
    const res = await sessionsGet();
    expect(res.status).toBe(401);
  });

  test("lists sessions with the current device flagged", async () => {
    routeStubs.meUser = makePublicUser();
    routeStubs.sessionItems = [
      {
        familyId: "family-1",
        deviceLabel: "Phone",
        createdAt: null,
        expiresAt: null,
        current: true,
      },
    ];
    setMockCookies({ [ACCESS_COOKIE]: "access-1" });
    const res = await sessionsGet();
    expect(await readJsonBody(res)).toMatchObject({
      sessions: [{ familyId: "family-1", current: true }],
    });
  });
});

describe("DELETE /api/auth/sessions/[familyId]", () => {
  test("revokes one family for the authenticated user", async () => {
    routeStubs.meUser = makePublicUser();
    setMockCookies({ [ACCESS_COOKIE]: "access-1" });
    const res = await sessionDelete(new Request("http://localhost/x"), {
      params: Promise.resolve({ familyId: "family-9" }),
    });
    expect(await readJsonBody(res)).toEqual({ ok: true });
    expect(authServiceMocks.revokeSession.mock.calls[0]?.[1]).toBe("family-9");
  });

  test("requires authentication", async () => {
    const res = await sessionDelete(new Request("http://localhost/x"), {
      params: Promise.resolve({ familyId: "family-9" }),
    });
    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/change-password", () => {
  const payload = {
    currentPassword: "secret123",
    newPassword: "brandnew1",
    confirmPassword: "brandnew1",
  };

  test("sets fresh cookies after a successful rotation", async () => {
    routeStubs.meUser = makePublicUser();
    setMockCookies({ [ACCESS_COOKIE]: "access-1" });
    const res = await changePasswordPost(
      postJsonRequest("/api/auth/change-password", payload),
    );
    expect(res.status).toBe(200);
    expect(getResponseCookie(res, ACCESS_COOKIE)).toBe("access-token");
  });

  test("requires authentication", async () => {
    const res = await changePasswordPost(
      postJsonRequest("/api/auth/change-password", payload),
    );
    expect(res.status).toBe(401);
  });

  test("passes validation failures through", async () => {
    routeStubs.meUser = makePublicUser();
    routeStubs.changePasswordResult = {
      ok: false,
      status: 400,
      errors: { newPassword: "too weak" },
    };
    setMockCookies({ [ACCESS_COOKIE]: "access-1" });
    const res = await changePasswordPost(
      postJsonRequest("/api/auth/change-password", payload),
    );
    expect(res.status).toBe(400);
    expect(await readJsonBody(res)).toMatchObject({
      errors: { newPassword: "too weak" },
    });
  });
});
