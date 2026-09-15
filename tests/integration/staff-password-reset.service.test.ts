import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makeUserRow } from "../helpers/auth.fixtures";
import {
  passwordMocks,
  resetServiceMocks,
  serviceStubs,
  staffTempCryptoMocks,
  staffTempRepoMocks,
  userRepoMocks,
} from "../helpers/service-mocks";

mock.module("@/lib/auth/user.repository", () => userRepoMocks);
mock.module("@/lib/auth/password", () => passwordMocks);
mock.module("@/lib/auth/staff-temp.repository", () => staffTempRepoMocks);
mock.module("@/lib/auth/staff-temp-crypto", () => staffTempCryptoMocks);

import { resetStaffTempPassword } from "@/lib/auth/staff-password-reset.service";

const ADMIN_ID = "99999999-9999-4999-8999-999999999999";
const TARGET_ID = "33333333-3333-4333-8333-333333333333";

beforeEach(() => {
  resetServiceMocks();
});

function savedPlain(): string | undefined {
  const enc = staffTempRepoMocks.saveTempPassword.mock.calls[0]?.[1];
  return typeof enc === "string" && enc.startsWith("enc:")
    ? enc.slice("enc:".length)
    : undefined;
}

describe("resetStaffTempPassword", () => {
  test("rotates the hash, bumps tokens and persists the new temp", async () => {
    serviceStubs.userById = makeUserRow({
      user_id: TARGET_ID,
      role: "mechanic",
      status: "active",
    });
    const result = await resetStaffTempPassword(ADMIN_ID, TARGET_ID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.tempPassword).toHaveLength(12);
    expect(result.user.id).toBe(TARGET_ID);
    const plain = savedPlain();
    expect(plain).toBe(result.tempPassword);
    expect(userRepoMocks.updatePassword.mock.calls[0]).toEqual([
      TARGET_ID,
      `hashed:${plain}`,
    ]);
    expect(userRepoMocks.bumpTokenVersion.mock.calls[0]?.[0]).toBe(TARGET_ID);
    expect(staffTempRepoMocks.saveTempPassword.mock.calls[0]?.[2]).toBe(
      ADMIN_ID,
    );
  });

  test("refuses self, other admins and trashed accounts untouched", async () => {
    serviceStubs.userById = makeUserRow({ user_id: ADMIN_ID, role: "admin" });
    expect(await resetStaffTempPassword(ADMIN_ID, ADMIN_ID)).toMatchObject({
      ok: false,
      status: 403,
    });

    serviceStubs.userById = makeUserRow({ user_id: "other", role: "admin" });
    expect(await resetStaffTempPassword(ADMIN_ID, "other")).toMatchObject({
      ok: false,
      status: 403,
    });

    serviceStubs.userById = makeUserRow({
      user_id: TARGET_ID,
      role: "mechanic",
      status: "deleted",
    });
    expect(await resetStaffTempPassword(ADMIN_ID, TARGET_ID)).toMatchObject({
      ok: false,
      status: 400,
    });

    serviceStubs.userById = null;
    expect(await resetStaffTempPassword(ADMIN_ID, TARGET_ID)).toMatchObject({
      ok: false,
      status: 404,
    });

    expect(userRepoMocks.updatePassword.mock.calls.length).toBe(0);
    expect(staffTempRepoMocks.saveTempPassword.mock.calls.length).toBe(0);
  });
});
