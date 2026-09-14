import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makeRegisterInput, makeUserRow } from "../helpers/auth.fixtures";
import {
  passwordMocks,
  refreshRepoMocks,
  resetServiceMocks,
  serviceStubs,
  userRepoMocks,
} from "../helpers/service-mocks";

// Helpers first, mocks second, system under test last: bun hoists
// mock.module above imports, and each factory only hands out the handles
// defined above, so every suite below reconfigures via `serviceStubs`.
mock.module("@/lib/auth/user.repository", () => userRepoMocks);
mock.module("@/lib/auth/refresh.repository", () => refreshRepoMocks);
mock.module("@/lib/auth/password", () => passwordMocks);

import {
  authenticate,
  loginUser,
  refreshSession,
  registerUser,
} from "@/lib/auth/auth.service";
import {
  createRefreshToken,
  hashToken,
  signAccessToken,
} from "@/lib/auth/session";

beforeEach(() => {
  resetServiceMocks();
});

describe("registerUser", () => {
  test("creates the account and opens a session on success", async () => {
    serviceStubs.userById = makeUserRow();
    const result = await registerUser(makeRegisterInput(), "Test device");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.user.phone).toBe("0912345678");
    expect(result.tokens.familyId).toBeDefined();
    expect(refreshRepoMocks.createSession.mock.calls.length).toBe(1);
  });

  test("rejects invalid input without touching the database", async () => {
    const result = await registerUser(
      makeRegisterInput({ phone: "bad" }),
      "Test device",
    );
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(userRepoMocks.createUser.mock.calls.length).toBe(0);
  });

  test("reports 409 for an already registered phone", async () => {
    serviceStubs.phoneOwner = "existing-user";
    const result = await registerUser(makeRegisterInput(), "Test device");
    expect(result).toMatchObject({ ok: false, status: 409 });
    if (result.ok) return;
    expect(result.errors.phone).toBeDefined();
    expect(result.errors.email).toBeUndefined();
    expect(userRepoMocks.createUser.mock.calls.length).toBe(0);
  });

  test("reports 409 for an already registered email", async () => {
    serviceStubs.emailOwner = "existing-user";
    const result = await registerUser(makeRegisterInput(), "Test device");
    expect(result).toMatchObject({ ok: false, status: 409 });
    if (result.ok) return;
    expect(result.errors.email).toBeDefined();
    expect(result.errors.phone).toBeUndefined();
  });

  test("maps a lost LWT race to 409 instead of 500", async () => {
    serviceStubs.createUserOutcome = { ok: false, conflict: "phone" };
    serviceStubs.phoneOwner = "race-winner";
    const result = await registerUser(makeRegisterInput(), "Test device");
    expect(result).toMatchObject({ ok: false, status: 409 });
    if (result.ok) return;
    expect(result.errors.phone).toBeDefined();
  });
});

describe("loginUser", () => {
  test("logs in with a phone number and opens a session", async () => {
    serviceStubs.phoneOwner = "user-1";
    serviceStubs.userById = makeUserRow({ user_id: "user-1" });
    const result = await loginUser(
      { identifier: "0912345678", password: "secret123" },
      "Test device",
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.user.id).toBe("user-1");
    expect(refreshRepoMocks.createSession.mock.calls.length).toBe(1);
  });

  test("rejects unknown identifiers with 401", async () => {
    const result = await loginUser(
      { identifier: "0912345678", password: "secret123" },
      "Test device",
    );
    expect(result).toMatchObject({ ok: false, status: 401 });
  });

  test("rejects wrong passwords with 401", async () => {
    serviceStubs.phoneOwner = "user-1";
    serviceStubs.userById = makeUserRow({ password_hash: "hashed:other" });
    const result = await loginUser(
      { identifier: "0912345678", password: "secret123" },
      "Test device",
    );
    expect(result).toMatchObject({ ok: false, status: 401 });
  });

  test("rejects locked accounts with 403", async () => {
    serviceStubs.phoneOwner = "user-1";
    serviceStubs.userById = makeUserRow({ status: "locked" });
    const result = await loginUser(
      { identifier: "0912345678", password: "secret123" },
      "Test device",
    );
    expect(result).toMatchObject({ ok: false, status: 403 });
  });
});

describe("authenticate", () => {
  test("returns the user for a matching token version", async () => {
    serviceStubs.userById = makeUserRow({
      user_id: "user-1",
      token_version: 2,
    });
    const token = await signAccessToken("user-1", 2);
    const user = await authenticate(token);
    expect(user?.id).toBe("user-1");
  });

  test("returns null for tampered or stale tokens", async () => {
    serviceStubs.userById = makeUserRow({
      user_id: "user-1",
      token_version: 0,
    });
    expect(await authenticate("broken")).toBeNull();
    const stale = await signAccessToken("user-1", 9);
    expect(await authenticate(stale)).toBeNull();
  });
});

describe("refreshSession", () => {
  test("rotates a valid refresh token", async () => {
    const created = createRefreshToken("user-1", "family-1");
    serviceStubs.sessionRow = {
      user_id: "user-1",
      family_id: "family-1",
      token_hash: hashToken(created.token),
      previous_token_hash: null,
      device_label: "device",
      created_at: new Date(),
      rotated_at: null,
      expires_at: new Date(Date.now() + 3_600_000),
    };
    serviceStubs.userById = makeUserRow({ user_id: "user-1" });
    const outcome = await refreshSession(created.token, "device");
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.user.id).toBe("user-1");
    expect(outcome.tokens.familyId).toBe("family-1");
  });

  test("treats malformed tokens as expired without revoking", async () => {
    const outcome = await refreshSession("garbage", "device");
    expect(outcome).toEqual({ ok: false, revoked: false });
  });

  test("revokes the family on an unknown token", async () => {
    const created = createRefreshToken("user-1", "family-1");
    serviceStubs.sessionRow = {
      user_id: "user-1",
      family_id: "family-1",
      token_hash: "different-hash",
      previous_token_hash: null,
      device_label: "device",
      created_at: new Date(),
      rotated_at: null,
      expires_at: new Date(Date.now() + 3_600_000),
    };
    const outcome = await refreshSession(created.token, "device");
    expect(outcome).toEqual({ ok: false, revoked: true });
    expect(refreshRepoMocks.deleteSession.mock.calls.length).toBe(1);
  });
});
