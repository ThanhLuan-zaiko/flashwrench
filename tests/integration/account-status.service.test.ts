import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makePublicUser, makeUserRow } from "../helpers/auth.fixtures";
import {
  authServiceMocks,
  resetRouteMocks,
  routeStubs,
} from "../helpers/route-mocks";
import {
  resetServiceMocks,
  serviceStubs,
  userRepoMocks,
} from "../helpers/service-mocks";

// `readAccountSession` is the reason the browser can tell a locked account
// from an ended session. `authenticate` answers "usable or not" (shared
// handle), the token claims and the account row supply the reason.

const claimsStubs = {
  claims: null as { userId: string; tokenVersion: number } | null,
};

const sessionMocks = {
  verifyAccessToken: mock(async (_token: string) => claimsStubs.claims),
};

// Helpers first, mocks second, system under test last.
mock.module("@/lib/auth/auth.service", () => authServiceMocks);
mock.module("@/lib/auth/session", () => sessionMocks);
mock.module("@/lib/auth/user.repository", () => userRepoMocks);

import { readAccountSession } from "@/lib/auth/account-status.service";

beforeEach(() => {
  resetRouteMocks();
  resetServiceMocks();
  claimsStubs.claims = null;
});

describe("readAccountSession", () => {
  test("returns the user with an active status for a usable session", async () => {
    routeStubs.meUser = makePublicUser({ id: "user-1" });
    const session = await readAccountSession("access-1");
    expect(session).toMatchObject({ status: "active" });
    expect(session.user?.id).toBe("user-1");
    // No second read for a healthy session.
    expect(sessionMocks.verifyAccessToken.mock.calls.length).toBe(0);
    expect(userRepoMocks.findUserById.mock.calls.length).toBe(0);
  });

  test("reports a locked account so the browser can force the logout", async () => {
    routeStubs.meUser = null;
    claimsStubs.claims = { userId: "user-1", tokenVersion: 4 };
    serviceStubs.userById = makeUserRow({
      user_id: "user-1",
      status: "locked",
    });
    expect(await readAccountSession("access-1")).toEqual({
      user: null,
      status: "locked",
    });
  });

  test("reports a deleted account", async () => {
    routeStubs.meUser = null;
    claimsStubs.claims = { userId: "user-1", tokenVersion: 0 };
    serviceStubs.userById = makeUserRow({
      user_id: "user-1",
      status: "deleted",
    });
    expect(await readAccountSession("access-1")).toEqual({
      user: null,
      status: "deleted",
    });
  });

  test("treats an invalid token as an ended session, not a lock", async () => {
    routeStubs.meUser = null;
    claimsStubs.claims = null;
    expect(await readAccountSession("broken")).toEqual({
      user: null,
      status: "active",
    });
    expect(userRepoMocks.findUserById.mock.calls.length).toBe(0);
  });

  test("treats a stale token version on an active account as an ended session", async () => {
    routeStubs.meUser = null;
    claimsStubs.claims = { userId: "user-1", tokenVersion: 0 };
    serviceStubs.userById = makeUserRow({
      user_id: "user-1",
      status: "active",
    });
    expect(await readAccountSession("access-1")).toEqual({
      user: null,
      status: "active",
    });
  });

  test("treats a missing account row as an ended session", async () => {
    routeStubs.meUser = null;
    claimsStubs.claims = { userId: "ghost", tokenVersion: 0 };
    serviceStubs.userById = null;
    expect(await readAccountSession("access-1")).toEqual({
      user: null,
      status: "active",
    });
  });
});
