import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makeAdminRoleRow, makeUserRow } from "../helpers/auth.fixtures";
import {
  adminStubs,
  adminUsersRepoMocks,
  refreshRepoMocks,
  resetServiceMocks,
  serviceStubs,
  userRepoMocks,
} from "../helpers/service-mocks";

// Helpers first, mocks second, system under test last: bun hoists
// mock.module above imports, and each factory only hands out the handles
// defined above, so every suite below reconfigures via stubs.
mock.module("@/lib/auth/admin-users.repository", () => adminUsersRepoMocks);
mock.module("@/lib/auth/user.repository", () => userRepoMocks);
// Locking revokes the account's refresh families (forced logout), so the
// session repository is stubbed too.
mock.module("@/lib/auth/refresh.repository", () => refreshRepoMocks);

import {
  applyAdminUserAction,
  listAdminUsers,
} from "@/lib/auth/admin-users.service";

const ADMIN_ID = "99999999-9999-4999-8999-999999999999";

beforeEach(() => {
  resetServiceMocks();
});

describe("listAdminUsers", () => {
  test("merges pages, dedupes, filters status, sorts newest first", async () => {
    adminStubs.rolePages = [
      makeAdminRoleRow({
        user_id: "a",
        created_at: new Date("2026-09-01T00:00:00.000Z"),
      }),
      makeAdminRoleRow({
        user_id: "a",
        created_at: new Date("2026-09-01T00:00:00.000Z"),
      }),
      makeAdminRoleRow({
        user_id: "b",
        status: "active",
        created_at: new Date("2026-09-12T00:00:00.000Z"),
      }),
    ];
    const result = await listAdminUsers({
      role: "mechanic",
      status: "pending_verification",
      months: 1,
      limit: 50,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.users.map((u) => u.id)).toEqual(["a"]);
    expect(result.users[0]?.status).toBe("pending_verification");
  });

  test("rejects an unknown role filter", async () => {
    const result = await listAdminUsers({ role: "owner" as never });
    expect(result).toMatchObject({ ok: false, status: 400 });
  });
});

describe("applyAdminUserAction", () => {
  test("approves a pending mechanic without bumping the token", async () => {
    serviceStubs.userById = makeUserRow({
      user_id: "target-1",
      role: "mechanic",
      status: "pending_verification",
    });
    const result = await applyAdminUserAction(ADMIN_ID, "target-1", "approve");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.user.id).toBe("target-1");
    expect(adminUsersRepoMocks.setIdStatus.mock.calls[0]?.[1]).toBe("active");
    expect(adminUsersRepoMocks.setIdStatus.mock.calls[0]?.[2]).toBeNull();
    expect(adminUsersRepoMocks.setRoleStatus.mock.calls[0]?.[4]).toBe("active");
  });

  test("refuses to approve an account that is not pending", async () => {
    serviceStubs.userById = makeUserRow({
      user_id: "target-1",
      role: "mechanic",
      status: "active",
    });
    const result = await applyAdminUserAction(ADMIN_ID, "target-1", "approve");
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(adminUsersRepoMocks.setIdStatus.mock.calls.length).toBe(0);
  });

  test("locks an active account and bumps the token version", async () => {
    serviceStubs.userById = makeUserRow({
      user_id: "target-1",
      role: "customer",
      status: "active",
      token_version: 4,
    });
    const result = await applyAdminUserAction(ADMIN_ID, "target-1", "lock");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.user.id).toBe("target-1");
    expect(adminUsersRepoMocks.setIdStatus.mock.calls[0]?.[1]).toBe("locked");
    expect(adminUsersRepoMocks.setIdStatus.mock.calls[0]?.[2]).toBe(5);
    expect(adminUsersRepoMocks.setRoleStatus.mock.calls[0]?.[4]).toBe("locked");
  });

  test("forces a logout on every device when locking", async () => {
    serviceStubs.userById = makeUserRow({
      user_id: "target-1",
      role: "customer",
      status: "active",
      token_version: 2,
    });
    const createdAt = new Date("2026-09-02T00:00:00.000Z");
    serviceStubs.userSessions = [
      {
        family_id: "laptop",
        device_label: "Chrome",
        created_at: createdAt,
        expires_at: null,
      },
      {
        family_id: "phone",
        device_label: "Safari",
        created_at: null,
        expires_at: null,
      },
    ];

    await applyAdminUserAction(ADMIN_ID, "target-1", "lock");

    expect(refreshRepoMocks.listSessionsByUser.mock.calls[0]?.[0]).toBe(
      "target-1",
    );
    expect(refreshRepoMocks.deleteSession.mock.calls).toEqual([
      ["target-1", "laptop", createdAt],
      ["target-1", "phone", null],
    ]);
  });

  test("keeps the sessions of an approved or unlocked account", async () => {
    serviceStubs.userById = makeUserRow({
      user_id: "target-1",
      role: "mechanic",
      status: "pending_verification",
    });
    await applyAdminUserAction(ADMIN_ID, "target-1", "approve");
    expect(refreshRepoMocks.listSessionsByUser.mock.calls.length).toBe(0);

    serviceStubs.userById = makeUserRow({
      user_id: "target-1",
      role: "mechanic",
      status: "locked",
    });
    await applyAdminUserAction(ADMIN_ID, "target-1", "unlock");
    expect(refreshRepoMocks.listSessionsByUser.mock.calls.length).toBe(0);
    expect(refreshRepoMocks.deleteSession.mock.calls.length).toBe(0);
  });

  test("does not touch sessions when the lock is rejected", async () => {
    serviceStubs.userById = makeUserRow({
      user_id: "target-1",
      role: "customer",
      status: "locked",
    });
    const result = await applyAdminUserAction(ADMIN_ID, "target-1", "lock");
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(refreshRepoMocks.deleteSession.mock.calls.length).toBe(0);
  });

  test("unlocks a locked account", async () => {
    serviceStubs.userById = makeUserRow({
      user_id: "target-1",
      role: "customer",
      status: "locked",
    });
    const result = await applyAdminUserAction(ADMIN_ID, "target-1", "unlock");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.user.id).toBe("target-1");
    expect(adminUsersRepoMocks.setIdStatus.mock.calls[0]?.[1]).toBe("active");
    expect(adminUsersRepoMocks.setRoleStatus.mock.calls[0]?.[4]).toBe("active");
  });

  test("forbids self-actions and actions on other admins", async () => {
    serviceStubs.userById = makeUserRow({ user_id: ADMIN_ID, role: "admin" });
    const self = await applyAdminUserAction(ADMIN_ID, ADMIN_ID, "lock");
    expect(self).toMatchObject({ ok: false, status: 403 });

    serviceStubs.userById = makeUserRow({ user_id: "other", role: "admin" });
    const other = await applyAdminUserAction(ADMIN_ID, "other", "unlock");
    expect(other).toMatchObject({ ok: false, status: 403 });
    expect(adminUsersRepoMocks.setIdStatus.mock.calls.length).toBe(0);
  });

  test("returns 404 for an unknown account", async () => {
    serviceStubs.userById = null;
    const result = await applyAdminUserAction(ADMIN_ID, "ghost", "lock");
    expect(result).toMatchObject({ ok: false, status: 404 });
  });
});
