import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makeUserRow } from "../helpers/auth.fixtures";
import {
  adminUsersRepoMocks,
  passwordMocks,
  refreshRepoMocks,
  resetServiceMocks,
  serviceStubs,
  staffRepoMocks,
  userRepoMocks,
} from "../helpers/service-mocks";

// Helpers first, mocks second, system under test last: bun hoists
// mock.module above imports, and each factory only hands out the handles
// defined above, so every suite below reconfigures via stubs.
mock.module("@/lib/auth/admin-users.repository", () => adminUsersRepoMocks);
mock.module("@/lib/auth/user.repository", () => userRepoMocks);
mock.module("@/lib/auth/staff.repository", () => staffRepoMocks);
mock.module("@/lib/auth/password", () => passwordMocks);
mock.module("@/lib/auth/refresh.repository", () => refreshRepoMocks);

import { applyAdminUserAction } from "@/lib/auth/admin-users.service";
import {
  createStaff,
  hardDeleteStaff,
  restoreStaff,
  softDeleteStaff,
  updateStaff,
} from "@/lib/auth/staff.service";

const ADMIN_ID = "99999999-9999-4999-8999-999999999999";
const TARGET_ID = "33333333-3333-4333-8333-333333333333";

const CREATE_INPUT = {
  fullName: "Tran Van Tho",
  phone: "0901111222",
  email: "tho@example.com",
  role: "mechanic" as const,
};

beforeEach(() => {
  resetServiceMocks();
});

describe("createStaff", () => {
  test("creates a mechanic with a one-time temp password", async () => {
    serviceStubs.userById = makeUserRow({
      user_id: TARGET_ID,
      role: "mechanic",
      status: "active",
    });
    const result = await createStaff(ADMIN_ID, CREATE_INPUT);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.user.role).toBe("mechanic");
    expect(result.tempPassword).toHaveLength(12);
    expect(userRepoMocks.createUserWithRole.mock.calls[0]?.[0]).toMatchObject({
      phone: "0901111222",
      email: "tho@example.com",
      role: "mechanic",
    });
  });

  test("rejects the admin role", async () => {
    const result = await createStaff(ADMIN_ID, {
      ...CREATE_INPUT,
      role: "admin" as never,
    });
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(userRepoMocks.createUserWithRole.mock.calls.length).toBe(0);
  });

  test("rejects the customer role on create", async () => {
    const result = await createStaff(ADMIN_ID, {
      ...CREATE_INPUT,
      role: "customer",
    });
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(userRepoMocks.createUserWithRole.mock.calls.length).toBe(0);
  });

  test("returns 409 for a taken phone without creating", async () => {
    serviceStubs.phoneOwner = "someone-else";
    const result = await createStaff(ADMIN_ID, CREATE_INPUT);
    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(userRepoMocks.createUserWithRole.mock.calls.length).toBe(0);
  });
});

describe("updateStaff", () => {
  test("updates name and role, moving the role partition", async () => {
    serviceStubs.userById = makeUserRow({
      user_id: TARGET_ID,
      role: "mechanic",
      status: "active",
    });
    const result = await updateStaff(ADMIN_ID, TARGET_ID, {
      fullName: "Tran Van Tho Moi",
      phone: "0912345678",
      email: "an@example.com",
      role: "dispatcher",
    });
    expect(result.ok).toBe(true);
    expect(staffRepoMocks.setIdProfile.mock.calls.length).toBe(1);
    expect(staffRepoMocks.setIdRole.mock.calls[0]?.[1]).toBe("dispatcher");
    expect(staffRepoMocks.deleteRoleRow.mock.calls.length).toBe(1);
    expect(staffRepoMocks.insertRoleRow.mock.calls.length).toBe(1);
    expect(userRepoMocks.claimPhone.mock.calls.length).toBe(0);
  });

  test("claims a new phone and releases the old one", async () => {
    serviceStubs.userById = makeUserRow({
      user_id: TARGET_ID,
      phone: "0912345678",
      email: "an@example.com",
      role: "mechanic",
      status: "active",
    });
    const result = await updateStaff(ADMIN_ID, TARGET_ID, {
      fullName: "Tran Van Tho",
      phone: "0901111222",
      email: "an@example.com",
      role: "mechanic",
    });
    expect(result.ok).toBe(true);
    expect(userRepoMocks.claimPhone.mock.calls[0]?.[0]).toBe("0901111222");
    expect(userRepoMocks.releasePhone.mock.calls[0]?.[0]).toBe("0912345678");
    expect(staffRepoMocks.setIdContacts.mock.calls.length).toBe(1);
  });

  test("returns 409 for a taken phone and leaves storage untouched", async () => {
    serviceStubs.userById = makeUserRow({
      user_id: TARGET_ID,
      role: "mechanic",
    });
    serviceStubs.phoneOwner = "someone-else";
    const result = await updateStaff(ADMIN_ID, TARGET_ID, {
      fullName: "Tran Van Tho",
      phone: "0901111222",
      email: "an@example.com",
      role: "mechanic",
    });
    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(staffRepoMocks.setIdProfile.mock.calls.length).toBe(0);
    expect(staffRepoMocks.setIdContacts.mock.calls.length).toBe(0);
  });

  test("forbids self edits and edits on other admins", async () => {
    serviceStubs.userById = makeUserRow({ user_id: ADMIN_ID, role: "admin" });
    const self = await updateStaff(ADMIN_ID, ADMIN_ID, {
      ...CREATE_INPUT,
      role: "mechanic",
    });
    expect(self).toMatchObject({ ok: false, status: 403 });

    serviceStubs.userById = makeUserRow({ user_id: "other", role: "admin" });
    const other = await updateStaff(ADMIN_ID, "other", {
      ...CREATE_INPUT,
      role: "mechanic",
    });
    expect(other).toMatchObject({ ok: false, status: 403 });
    expect(staffRepoMocks.setIdProfile.mock.calls.length).toBe(0);
  });

  test("rejects edits on trashed accounts", async () => {
    serviceStubs.userById = makeUserRow({
      user_id: TARGET_ID,
      role: "mechanic",
      status: "deleted",
    });
    const result = await updateStaff(ADMIN_ID, TARGET_ID, {
      ...CREATE_INPUT,
      role: "mechanic",
    });
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(staffRepoMocks.setIdProfile.mock.calls.length).toBe(0);
  });
});

describe("softDeleteStaff / restoreStaff", () => {
  test("soft deletes an active account and bumps the token", async () => {
    serviceStubs.userById = makeUserRow({
      user_id: TARGET_ID,
      role: "customer",
      status: "active",
      token_version: 2,
    });
    const result = await softDeleteStaff(ADMIN_ID, TARGET_ID);
    expect(result.ok).toBe(true);
    expect(adminUsersRepoMocks.setIdStatus.mock.calls[0]?.[1]).toBe("deleted");
    expect(adminUsersRepoMocks.setIdStatus.mock.calls[0]?.[2]).toBe(3);
  });

  test("refuses to soft delete twice or the admin themselves", async () => {
    serviceStubs.userById = makeUserRow({
      user_id: TARGET_ID,
      role: "customer",
      status: "deleted",
    });
    expect(await softDeleteStaff(ADMIN_ID, TARGET_ID)).toMatchObject({
      ok: false,
      status: 400,
    });

    serviceStubs.userById = makeUserRow({ user_id: ADMIN_ID, role: "admin" });
    expect(await softDeleteStaff(ADMIN_ID, ADMIN_ID)).toMatchObject({
      ok: false,
      status: 403,
    });
  });

  test("restores a trashed account to active", async () => {
    serviceStubs.userById = makeUserRow({
      user_id: TARGET_ID,
      role: "mechanic",
      status: "deleted",
    });
    const result = await restoreStaff(ADMIN_ID, TARGET_ID);
    expect(result.ok).toBe(true);
    expect(adminUsersRepoMocks.setIdStatus.mock.calls[0]?.[1]).toBe("active");
  });

  test("refuses to restore a non-trashed account", async () => {
    serviceStubs.userById = makeUserRow({
      user_id: TARGET_ID,
      role: "mechanic",
      status: "locked",
    });
    const result = await restoreStaff(ADMIN_ID, TARGET_ID);
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(adminUsersRepoMocks.setIdStatus.mock.calls.length).toBe(0);
  });
});

describe("hardDeleteStaff", () => {
  test("permanently removes a trashed account with phone confirm", async () => {
    serviceStubs.userById = makeUserRow({
      user_id: TARGET_ID,
      phone: "0901111222",
      email: "tho@example.com",
      role: "mechanic",
      status: "deleted",
    });
    serviceStubs.userSessions = [];
    const result = await hardDeleteStaff(ADMIN_ID, TARGET_ID, "0901111222");
    expect(result.ok).toBe(true);
    expect(staffRepoMocks.deleteRoleRow.mock.calls.length).toBe(1);
    expect(staffRepoMocks.deletePhoneRow.mock.calls[0]?.[0]).toBe("0901111222");
    expect(staffRepoMocks.deleteEmailRow.mock.calls.length).toBe(1);
    expect(staffRepoMocks.deleteIdRow.mock.calls[0]?.[0]).toBe(TARGET_ID);
  });

  test("rejects a wrong confirm and deletes nothing", async () => {
    serviceStubs.userById = makeUserRow({
      user_id: TARGET_ID,
      phone: "0901111222",
      role: "mechanic",
      status: "deleted",
    });
    const result = await hardDeleteStaff(ADMIN_ID, TARGET_ID, "0000000000");
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(staffRepoMocks.deleteIdRow.mock.calls.length).toBe(0);
    expect(staffRepoMocks.deleteRoleRow.mock.calls.length).toBe(0);
  });

  test("refuses to hard delete outside the trash", async () => {
    serviceStubs.userById = makeUserRow({
      user_id: TARGET_ID,
      role: "mechanic",
      status: "active",
    });
    const result = await hardDeleteStaff(ADMIN_ID, TARGET_ID, "0912345678");
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(staffRepoMocks.deleteIdRow.mock.calls.length).toBe(0);
  });
});

describe("deleted accounts and legacy admin actions", () => {
  test("lock and unlock refuse trashed accounts", async () => {
    serviceStubs.userById = makeUserRow({
      user_id: TARGET_ID,
      role: "customer",
      status: "deleted",
    });
    expect(
      await applyAdminUserAction(ADMIN_ID, TARGET_ID, "lock"),
    ).toMatchObject({ ok: false, status: 400 });
    expect(
      await applyAdminUserAction(ADMIN_ID, TARGET_ID, "unlock"),
    ).toMatchObject({ ok: false, status: 400 });
    expect(adminUsersRepoMocks.setIdStatus.mock.calls.length).toBe(0);
  });
});
