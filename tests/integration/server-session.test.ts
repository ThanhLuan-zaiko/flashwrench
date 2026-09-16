import { afterEach, describe, expect, mock, test } from "bun:test";
import type { AccountSession } from "@/lib/auth/account-status";
import { ACCESS_COOKIE } from "@/lib/auth/session";
import { toPublicUser } from "@/lib/auth/user.types";
import { makeUserRow } from "../helpers/auth.fixtures";

// Helpers first, mocks second, system under test last: bun hoists
// mock.module above imports. Cookie jar and reader behavior below are
// file-local because no shared stub covers the server session yet.
let cookieToken: string | undefined;
const readerCalls: unknown[][] = [];
let readerShouldThrow = false;
const stubSession: AccountSession = {
  user: toPublicUser(makeUserRow()),
  status: "active",
};

mock.module("next/headers", () => ({
  cookies: mock(async () => ({
    get: (name: string) =>
      name === ACCESS_COOKIE && cookieToken !== undefined
        ? { value: cookieToken }
        : undefined,
  })),
}));

mock.module("@/lib/auth/account-status.service", () => ({
  readAccountSession: mock(async (...args: unknown[]) => {
    readerCalls.push(args);
    if (readerShouldThrow) throw new Error("ScyllaDB unreachable");
    return stubSession;
  }),
}));

import { readServerAccountSession } from "@/lib/auth/server-session";

afterEach(() => {
  cookieToken = undefined;
  readerCalls.length = 0;
  readerShouldThrow = false;
});

describe("readServerAccountSession", () => {
  test("returns anonymous without touching the database when no token", async () => {
    cookieToken = undefined;

    await expect(readServerAccountSession()).resolves.toEqual({
      user: null,
      status: "active",
    });
    expect(readerCalls.length).toBe(0);
  });

  test("delegates the access token to the shared session reader", async () => {
    cookieToken = "valid-access-token";

    await expect(readServerAccountSession()).resolves.toEqual(stubSession);
    expect(readerCalls).toEqual([["valid-access-token"]]);
  });

  test("falls back to anonymous when the reader throws", async () => {
    cookieToken = "stale-access-token";
    readerShouldThrow = true;

    await expect(readServerAccountSession()).resolves.toEqual({
      user: null,
      status: "active",
    });
    expect(readerCalls.length).toBe(1);
  });
});
