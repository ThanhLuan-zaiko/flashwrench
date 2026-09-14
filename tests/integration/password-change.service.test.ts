import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makeUserRow } from "../helpers/auth.fixtures";
import {
  passwordMocks,
  refreshRepoMocks,
  resetServiceMocks,
  serviceStubs,
  userRepoMocks,
} from "../helpers/service-mocks";

mock.module("@/lib/auth/user.repository", () => userRepoMocks);
mock.module("@/lib/auth/refresh.repository", () => refreshRepoMocks);
mock.module("@/lib/auth/password", () => passwordMocks);

import { changePassword } from "@/lib/auth/password-change.service";

const VALID_ROTATION = {
  currentPassword: "secret123",
  newPassword: "brandnew1",
  confirmPassword: "brandnew1",
};

beforeEach(() => {
  resetServiceMocks();
});

describe("changePassword", () => {
  test("rotates the hash, drops every session and returns fresh tokens", async () => {
    serviceStubs.userById = makeUserRow({ user_id: "user-1" });
    serviceStubs.userSessions = [
      {
        family_id: "old-family",
        device_label: "Old phone",
        created_at: new Date(),
        expires_at: new Date(Date.now() + 3_600_000),
      },
    ];
    const result = await changePassword("user-1", VALID_ROTATION, "New phone");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.user.id).toBe("user-1");
    expect(result.tokens.familyId).toBeDefined();
    expect(userRepoMocks.updatePassword.mock.calls.length).toBe(1);
    expect(refreshRepoMocks.deleteSession.mock.calls.length).toBe(1);
    expect(refreshRepoMocks.createSession.mock.calls.length).toBe(1);
  });

  test("rejects invalid input without touching the database", async () => {
    const result = await changePassword(
      "user-1",
      { ...VALID_ROTATION, confirmPassword: "mismatch1" },
      "device",
    );
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(userRepoMocks.updatePassword.mock.calls.length).toBe(0);
  });

  test("rejects unknown or locked accounts with 401", async () => {
    const missing = await changePassword("ghost", VALID_ROTATION, "device");
    expect(missing).toMatchObject({ ok: false, status: 401 });
    serviceStubs.userById = makeUserRow({ status: "locked" });
    const locked = await changePassword("user-1", VALID_ROTATION, "device");
    expect(locked).toMatchObject({ ok: false, status: 401 });
  });

  test("rejects a wrong current password with 401", async () => {
    serviceStubs.userById = makeUserRow({ password_hash: "hashed:other" });
    const result = await changePassword(
      "user-1",
      { ...VALID_ROTATION, currentPassword: "secret123" },
      "device",
    );
    expect(result).toMatchObject({ ok: false, status: 401 });
    if (result.ok) return;
    expect(result.errors.currentPassword).toBeDefined();
    expect(userRepoMocks.updatePassword.mock.calls.length).toBe(0);
  });
});
