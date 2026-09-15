import { describe, expect, test } from "bun:test";
import {
  canAdminManageUser,
  excludeSelfAccount,
  getProtectionReason,
  isAdminAccount,
  isSelfAccount,
} from "@/app/admin/components/users/admin-user-guards";

const ME = "me-1";

describe("isSelfAccount", () => {
  test("matches identical ids", () => {
    expect(isSelfAccount(ME, ME)).toBe(true);
  });

  test("ignores missing current user", () => {
    expect(isSelfAccount(null, ME)).toBe(false);
    expect(isSelfAccount(undefined, ME)).toBe(false);
  });

  test("distinguishes other accounts", () => {
    expect(isSelfAccount(ME, "other-1")).toBe(false);
  });
});

describe("isAdminAccount", () => {
  test("flags only the admin role", () => {
    expect(isAdminAccount("admin")).toBe(true);
    expect(isAdminAccount("customer")).toBe(false);
    expect(isAdminAccount("mechanic")).toBe(false);
    expect(isAdminAccount("dispatcher")).toBe(false);
  });
});

describe("getProtectionReason", () => {
  test("self takes precedence over admin role", () => {
    expect(getProtectionReason(ME, { id: ME, role: "admin" })).toBe("self");
  });

  test("blocks other admin accounts", () => {
    expect(getProtectionReason(ME, { id: "other", role: "admin" })).toBe(
      "admin",
    );
  });

  test("allows other non-admin accounts", () => {
    expect(getProtectionReason(ME, { id: "other", role: "customer" })).toBe(
      null,
    );
    expect(getProtectionReason(ME, { id: "other", role: "mechanic" })).toBe(
      null,
    );
    expect(getProtectionReason(ME, { id: "other", role: "dispatcher" })).toBe(
      null,
    );
  });

  test("blocks admin role even when current user is unknown", () => {
    expect(getProtectionReason(null, { id: "other", role: "admin" })).toBe(
      "admin",
    );
  });
});

describe("canAdminManageUser", () => {
  test("forbids self lock", () => {
    expect(canAdminManageUser(ME, { id: ME, role: "customer" })).toBe(false);
    expect(canAdminManageUser(ME, { id: ME, role: "admin" })).toBe(false);
  });

  test("forbids other admins", () => {
    expect(canAdminManageUser(ME, { id: "other", role: "admin" })).toBe(false);
  });

  test("allows other regular accounts", () => {
    expect(canAdminManageUser(ME, { id: "other", role: "customer" })).toBe(
      true,
    );
  });
});

describe("excludeSelfAccount", () => {
  const rows = [
    { id: ME, role: "admin" as const },
    { id: "other-1", role: "customer" as const },
    { id: "other-2", role: "mechanic" as const },
  ];

  test("hides the current admin from lists", () => {
    expect(excludeSelfAccount(rows, ME).map((r) => r.id)).toEqual([
      "other-1",
      "other-2",
    ]);
  });

  test("keeps every row when the current user is unknown", () => {
    expect(excludeSelfAccount(rows, null)).toEqual(rows);
    expect(excludeSelfAccount(rows, undefined)).toEqual(rows);
  });

  test("returns a new array without mutating the input", () => {
    const snapshot = [...rows];
    excludeSelfAccount(rows, ME);
    expect(rows).toEqual(snapshot);
  });
});
