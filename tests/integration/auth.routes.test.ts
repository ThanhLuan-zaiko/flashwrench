import { beforeEach, describe, expect, mock, test } from "bun:test";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/session";
import {
  getResponseCookie,
  invalidJsonRequest,
  makePublicUser,
  postJsonRequest,
  readJsonBody,
} from "../helpers/auth.fixtures";
import {
  authServiceMocks,
  guardMocks,
  nextHeadersMocks,
  resetRouteMocks,
  routeStubs,
  setMockCookies,
} from "../helpers/route-mocks";

// Route suites stub every side effect: guards, services and `next/headers`.
// Each endpoint file below follows the same shape, so covering a new route
// later means copying one describe block, not inventing new harness code.
mock.module("@/lib/auth/guards", () => guardMocks);
mock.module("@/lib/auth/auth.service", () => authServiceMocks);
mock.module("next/headers", () => nextHeadersMocks);

import { POST as loginPost } from "@/app/api/auth/login/route";
import { GET as meGet } from "@/app/api/auth/me/route";
import { POST as registerPost } from "@/app/api/auth/register/route";

beforeEach(() => {
  resetRouteMocks();
  setMockCookies({});
});

describe("POST /api/auth/register", () => {
  test("returns 201 and sets both session cookies on success", async () => {
    routeStubs.registerResult = {
      ok: true,
      user: makePublicUser(),
      tokens: {
        accessToken: "access-1",
        refreshToken: "refresh-1",
        familyId: "family-1",
      },
    };
    const res = await registerPost(
      postJsonRequest("/api/auth/register", {
        fullName: "Nguyen Van An",
        phone: "0912345678",
        email: "an@example.com",
        password: "secret123",
        confirmPassword: "secret123",
      }),
    );
    expect(res.status).toBe(201);
    expect(await readJsonBody(res)).toMatchObject({
      user: { phone: "0912345678" },
    });
    expect(getResponseCookie(res, ACCESS_COOKIE)).toBe("access-1");
    expect(getResponseCookie(res, REFRESH_COOKIE)).toBe("refresh-1");
  });

  test("passes duplicate errors through with 409", async () => {
    routeStubs.registerResult = {
      ok: false,
      status: 409,
      errors: { phone: "taken" },
    };
    const res = await registerPost(
      postJsonRequest("/api/auth/register", { phone: "0912345678" }),
    );
    expect(res.status).toBe(409);
    expect(await readJsonBody(res)).toMatchObject({
      errors: { phone: "taken" },
    });
  });

  test("rejects malformed JSON with 400 without calling the service", async () => {
    const res = await registerPost(invalidJsonRequest("/api/auth/register"));
    expect(res.status).toBe(400);
    expect(authServiceMocks.registerUser.mock.calls.length).toBe(0);
  });

  test("returns the guard response when rate limited", async () => {
    routeStubs.guardBlocked = NextResponse.json(
      { errors: { form: "slow down" } },
      { status: 429 },
    );
    const res = await registerPost(postJsonRequest("/api/auth/register", {}));
    expect(res.status).toBe(429);
    expect(authServiceMocks.registerUser.mock.calls.length).toBe(0);
  });
});

describe("POST /api/auth/login", () => {
  test("returns the user and sets cookies on success", async () => {
    const res = await loginPost(
      postJsonRequest("/api/auth/login", {
        identifier: "0912345678",
        password: "secret123",
      }),
    );
    expect(res.status).toBe(200);
    expect(await readJsonBody(res)).toMatchObject({
      user: { id: "11111111-1111-4111-8111-111111111111" },
    });
    expect(getResponseCookie(res, ACCESS_COOKIE)).toBe("access-token");
  });

  test("passes credential errors through with 401", async () => {
    routeStubs.loginResult = {
      ok: false,
      status: 401,
      errors: { form: "bad credentials" },
    };
    const res = await loginPost(
      postJsonRequest("/api/auth/login", {
        identifier: "0912345678",
        password: "wrongpass1",
      }),
    );
    expect(res.status).toBe(401);
    expect(await readJsonBody(res)).toMatchObject({
      errors: { form: "bad credentials" },
    });
  });
});

describe("GET /api/auth/me", () => {
  test("returns null user without an access cookie", async () => {
    const res = await meGet();
    expect(await readJsonBody(res)).toEqual({ user: null });
  });

  test("returns the authenticated user", async () => {
    routeStubs.meUser = makePublicUser();
    setMockCookies({ [ACCESS_COOKIE]: "access-1" });
    const res = await meGet();
    expect(await readJsonBody(res)).toMatchObject({
      user: { phone: "0912345678" },
    });
  });

  test("returns null user when the token is invalid", async () => {
    routeStubs.meUser = null;
    setMockCookies({ [ACCESS_COOKIE]: "stale" });
    const res = await meGet();
    expect(await readJsonBody(res)).toEqual({ user: null });
  });
});
