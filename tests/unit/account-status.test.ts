import { describe, expect, test } from "bun:test";
import {
  ACCOUNT_LOCK_EVENT_KIND,
  accountBlockNotice,
  accountLockedLoginHref,
  isAccountLockedParam,
  parseAccountLockEvent,
  toBlockReason,
} from "@/lib/auth/account-status";

// Pure helpers behind the forced logout: the admin route publishes the
// event, the guard parses it and renders the notice, the login page reads
// the marker param. No React, no mocks.

describe("parseAccountLockEvent", () => {
  test("accepts the payload the admin lock route publishes", () => {
    expect(parseAccountLockEvent({ kind: "locked" })).toBe("locked");
    expect(ACCOUNT_LOCK_EVENT_KIND).toBe("locked");
  });

  test("ignores anything that is not a lock notice", () => {
    expect(parseAccountLockEvent(null)).toBeNull();
    expect(parseAccountLockEvent(undefined)).toBeNull();
    expect(parseAccountLockEvent("locked")).toBeNull();
    expect(parseAccountLockEvent({})).toBeNull();
    expect(parseAccountLockEvent({ kind: "deleted" })).toBeNull();
    expect(parseAccountLockEvent({ kind: "unlocked" })).toBeNull();
  });
});

describe("toBlockReason", () => {
  test("maps blocked statuses and leaves an active account alone", () => {
    expect(toBlockReason("active")).toBeNull();
    expect(toBlockReason("locked")).toBe("locked");
    expect(toBlockReason("deleted")).toBe("deleted");
  });
});

describe("accountBlockNotice", () => {
  test("explains the forced logout in Vietnamese for both reasons", () => {
    const locked = accountBlockNotice("locked");
    expect(locked.title).toBe("Tài khoản đã bị khóa");
    expect(locked.description).toContain("kết thúc");
    expect(locked.login).toContain("liên hệ");

    const deleted = accountBlockNotice("deleted");
    expect(deleted.title).toBe("Tài khoản đã bị xóa");
    expect(deleted.description.length).toBeGreaterThan(0);
  });
});

describe("login marker params", () => {
  test("round-trips the forced-logout marker", () => {
    expect(accountLockedLoginHref()).toBe("/login?locked=1");
    expect(isAccountLockedParam("1")).toBe(true);
    expect(isAccountLockedParam(undefined)).toBe(false);
    expect(isAccountLockedParam("0")).toBe(false);
    expect(isAccountLockedParam("true")).toBe(false);
  });
});
