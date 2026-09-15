import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  resetServiceMocks,
  staffTempCryptoMocks,
  staffTempRepoMocks,
  staffTempStubs,
} from "../helpers/service-mocks";

mock.module("@/lib/auth/staff-temp.repository", () => staffTempRepoMocks);
mock.module("@/lib/auth/staff-temp-crypto", () => staffTempCryptoMocks);

import {
  clearTempPassword,
  listPendingTempPasswords,
  persistTempPassword,
} from "@/lib/auth/staff-pending.service";

const USER_ID = "33333333-3333-4333-8333-333333333333";

beforeEach(() => {
  resetServiceMocks();
});

describe("staff pending passwords", () => {
  test("persists an encrypted temp password", async () => {
    await persistTempPassword(USER_ID, "Abc123XyZ9", "admin-1");
    expect(staffTempCryptoMocks.encryptTempPassword.mock.calls[0]?.[0]).toBe(
      "Abc123XyZ9",
    );
    expect(staffTempRepoMocks.saveTempPassword.mock.calls[0]).toEqual([
      USER_ID,
      "enc:Abc123XyZ9",
      "admin-1",
    ]);
  });

  test("clears the pending row", async () => {
    await clearTempPassword(USER_ID);
    expect(staffTempRepoMocks.deleteTempPassword.mock.calls[0]?.[0]).toBe(
      USER_ID,
    );
  });

  test("decrypts only the requested ids and skips missing rows", async () => {
    staffTempStubs.rowByUser[USER_ID] = {
      user_id: USER_ID,
      temp_password_enc: "enc:Abc123XyZ9",
      created_at: new Date("2026-09-10T00:00:00.000Z"),
      created_by: "admin-1",
    };
    const items = await listPendingTempPasswords([
      USER_ID,
      "44444444-4444-4444-8444-444444444444",
    ]);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      userId: USER_ID,
      tempPassword: "Abc123XyZ9",
    });
    expect(staffTempRepoMocks.findTempPassword.mock.calls.length).toBe(2);
  });

  test("dedupes ids and ignores blank entries", async () => {
    const items = await listPendingTempPasswords([USER_ID, USER_ID, "  ", ""]);
    expect(items).toEqual([]);
    expect(staffTempRepoMocks.findTempPassword.mock.calls.length).toBe(1);
  });

  test("skips undecryptable rows instead of failing", async () => {
    staffTempStubs.rowByUser[USER_ID] = {
      user_id: USER_ID,
      temp_password_enc: "corrupted",
      created_at: new Date(),
      created_by: "admin-1",
    };
    await expect(listPendingTempPasswords([USER_ID])).resolves.toEqual([]);
  });
});
