import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makeUserRow } from "../helpers/auth.fixtures";
import { AVATAR_ASSET_ID, makeMediaRow } from "../helpers/media.fixtures";
import { mediaRepoMocks, mediaStubs } from "../helpers/media.mocks";
import {
  passwordMocks,
  refreshRepoMocks,
  resetServiceMocks,
  serviceStubs,
  staffPendingMocks,
  staffRepoMocks,
  userRepoMocks,
} from "../helpers/service-mocks";

const mediaServiceMocks = {
  claimAssetForOwner: mock(
    async (
      _assetId: string,
      _ownerType: string,
      _ownerId: string,
    ): Promise<
      | { ok: true; data: { assetId: string } }
      | { ok: false; status: number; errors: { imageAssetId: string } }
    > =>
      mediaStubs.claimAssetResult ?? { ok: true, data: { assetId: _assetId } },
  ),
};

// Helpers first, mocks second, system under test last: bun hoists
// mock.module above imports, and each factory only hands out the handles
// defined above, so every suite below reconfigures via stubs.
mock.module("@/lib/auth/user.repository", () => userRepoMocks);
mock.module("@/lib/auth/staff.repository", () => staffRepoMocks);
mock.module("@/lib/auth/staff-pending.service", () => staffPendingMocks);
mock.module("@/lib/auth/password", () => passwordMocks);
mock.module("@/lib/auth/refresh.repository", () => refreshRepoMocks);
mock.module("@/lib/media/media.repository", () => mediaRepoMocks);
mock.module("@/lib/media/media.service", () => mediaServiceMocks);

import { createStaff } from "@/lib/auth/staff.service";

const ADMIN_ID = "99999999-9999-4999-8999-999999999999";
const TARGET_ID = "33333333-3333-4333-8333-333333333333";

const CREATE_INPUT = {
  fullName: "Tran Van Tho",
  phone: "0901111222",
  email: "tho@example.com",
  role: "mechanic" as const,
};

const AVATAR_URL = `/api/media/avatar/2026-09/${AVATAR_ASSET_ID}.jpg`;

function staffAvatarRow(
  overrides?: Partial<ReturnType<typeof makeMediaRow>>,
): ReturnType<typeof makeMediaRow> {
  return makeMediaRow({
    scope: "avatar",
    owner_type: "user",
    owner_id: "00000000-0000-4000-8000-000000000000",
    created_by: ADMIN_ID,
    file_path: `avatar/2026-09/${AVATAR_ASSET_ID}.jpg`,
    url: AVATAR_URL,
    ...overrides,
  });
}

function setAvatarFixture(
  overrides?: Partial<ReturnType<typeof makeMediaRow>>,
): void {
  mediaStubs.assetById = staffAvatarRow(overrides);
}

beforeEach(() => {
  resetServiceMocks();
});

describe("createStaff with avatar", () => {
  test("creates with an avatar: rebinds the pending owner and saves the url", async () => {
    setAvatarFixture({ owner_id: "44444444-4444-4444-8444-444444444444" });
    serviceStubs.userById = makeUserRow({
      user_id: TARGET_ID,
      role: "mechanic",
      avatar_url: AVATAR_URL,
    });
    // Pending owner check runs first: the random owner id is not a user,
    // so it must resolve to null while the created row resolves after.
    userRepoMocks.findUserById.mockImplementationOnce(async () => null);
    const result = await createStaff(ADMIN_ID, {
      ...CREATE_INPUT,
      avatarAssetId: AVATAR_ASSET_ID,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.user.avatarUrl).toBe(AVATAR_URL);
    expect(mediaRepoMocks.findAssetRowById.mock.calls[0]?.[0]).toBe(
      AVATAR_ASSET_ID,
    );
    const createdUserId = userRepoMocks.createUserWithRole.mock.calls[0]?.[0]
      ?.userId as string;
    expect(userRepoMocks.setAvatarUrl.mock.calls[0]).toEqual([
      createdUserId,
      AVATAR_URL,
    ]);
  });

  test("create rejects a foreign avatar asset without writing", async () => {
    setAvatarFixture({ created_by: "not-the-admin" });
    const result = await createStaff(ADMIN_ID, {
      ...CREATE_INPUT,
      avatarAssetId: AVATAR_ASSET_ID,
    });
    expect(result).toMatchObject({ ok: false, status: 403 });
    expect(userRepoMocks.createUserWithRole.mock.calls.length).toBe(0);
    expect(userRepoMocks.setAvatarUrl.mock.calls.length).toBe(0);
  });

  test("create rejects an unknown avatar asset with 404", async () => {
    mediaStubs.assetById = null;
    const result = await createStaff(ADMIN_ID, {
      ...CREATE_INPUT,
      avatarAssetId: AVATAR_ASSET_ID,
    });
    expect(result).toMatchObject({ ok: false, status: 404 });
    expect(userRepoMocks.createUserWithRole.mock.calls.length).toBe(0);
    expect(userRepoMocks.setAvatarUrl.mock.calls.length).toBe(0);
  });

  test("create rejects a malformed avatar id before any lookup", async () => {
    const result = await createStaff(ADMIN_ID, {
      ...CREATE_INPUT,
      avatarAssetId: "../../etc/passwd",
    });
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(mediaRepoMocks.findAssetRowById.mock.calls.length).toBe(0);
    expect(userRepoMocks.createUserWithRole.mock.calls.length).toBe(0);
  });
});
