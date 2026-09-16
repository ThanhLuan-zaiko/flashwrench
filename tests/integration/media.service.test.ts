import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makePublicUser } from "../helpers/auth.fixtures";
import { jpegBytes, makeMediaRow, pngBytes } from "../helpers/media.fixtures";
import {
  mediaRepoMocks,
  mediaStorageMocks,
  mediaStubs,
  resetServiceMocks,
  userRepoMocks,
} from "../helpers/service-mocks";

// Helpers first, mocks second, system under test last: bun hoists
// mock.module above imports. Disk and registry are stubbed; path
// helpers and validation run for real.
mock.module("@/lib/media/media.repository", () => mediaRepoMocks);
mock.module("@/lib/media/media-storage", () => mediaStorageMocks);
mock.module("@/lib/auth/user.repository", () => userRepoMocks);

import { setMyAvatar } from "@/lib/media/avatar.service";
import { createMediaAsset, deleteMediaAsset } from "@/lib/media/media.service";

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";

function uploadInput(overrides?: Record<string, unknown>) {
  return {
    ownerType: "avatar",
    ownerId: CUSTOMER_ID,
    scope: "avatar",
    file: jpegBytes(128),
    mime: "image/jpeg",
    width: 800,
    height: 600,
    alt: "",
    ...overrides,
  };
}

beforeEach(() => {
  resetServiceMocks();
});

describe("createMediaAsset", () => {
  test("stores the file and registers metadata with a public URL", async () => {
    const result = await createMediaAsset(makePublicUser(), uploadInput());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.url).toMatch(/^\/api\/media\/avatar\/\d{4}-\d{2}\//);
    expect(result.data).toMatchObject({
      mime: "image/jpeg",
      sizeBytes: 128,
      width: 800,
      height: 600,
    });
    expect(mediaStorageMocks.writeAssetFile.mock.calls.length).toBe(1);
    expect(mediaRepoMocks.insertAsset.mock.calls.length).toBe(1);
  });

  test("rejects catalog scopes for non-admins without touching disk", async () => {
    const result = await createMediaAsset(
      makePublicUser(),
      uploadInput({ scope: "service", ownerType: "service" }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(403);
    expect(mediaStorageMocks.writeAssetFile.mock.calls.length).toBe(0);
    expect(mediaRepoMocks.insertAsset.mock.calls.length).toBe(0);
  });

  test("allows admins to upload catalog images", async () => {
    const result = await createMediaAsset(
      makePublicUser({ role: "admin" }),
      uploadInput({ scope: "service", ownerType: "service" }),
    );

    expect(result.ok).toBe(true);
    expect(mediaStorageMocks.writeAssetFile.mock.calls.length).toBe(1);
  });

  test("rejects renamed executables by magic bytes", async () => {
    const png = pngBytes(64);
    const result = await createMediaAsset(
      makePublicUser(),
      uploadInput({ file: png, mime: "image/jpeg" }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(mediaStorageMocks.writeAssetFile.mock.calls.length).toBe(0);
  });

  test("cleans the orphan file when the registry write fails", async () => {
    mediaStubs.insertError = new Error("ScyllaDB down");

    await expect(
      createMediaAsset(makePublicUser(), uploadInput()),
    ).rejects.toThrow();
    expect(mediaStorageMocks.writeAssetFile.mock.calls.length).toBe(1);
    expect(mediaStorageMocks.deleteAssetFile.mock.calls.length).toBe(1);
  });
});

describe("deleteMediaAsset", () => {
  test("removes file and registry rows for the owner", async () => {
    mediaStubs.assetById = makeMediaRow();

    const result = await deleteMediaAsset(
      mediaStubs.assetById.asset_id,
      makePublicUser(),
    );

    expect(result.ok).toBe(true);
    expect(mediaStorageMocks.deleteAssetFile.mock.calls.length).toBe(1);
    expect(mediaRepoMocks.deleteAssetRows.mock.calls.length).toBe(1);
  });

  test("returns 404 for unknown assets and 403 for foreign ones", async () => {
    mediaStubs.assetById = null;
    const missing = await deleteMediaAsset("nope", makePublicUser());
    expect(missing).toMatchObject({ ok: false, status: 404 });

    mediaStubs.assetById = makeMediaRow({ created_by: "someone-else" });
    const foreign = await deleteMediaAsset(
      mediaStubs.assetById.asset_id,
      makePublicUser(),
    );
    expect(foreign).toMatchObject({ ok: false, status: 403 });
    expect(mediaStorageMocks.deleteAssetFile.mock.calls.length).toBe(0);
  });
});

describe("setMyAvatar", () => {
  test("points the profile at an owned avatar upload", async () => {
    const row = makeMediaRow();
    mediaStubs.assetById = row;

    const result = await setMyAvatar(makePublicUser(), row.asset_id);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.avatarUrl).toBe(row.url ?? "");
    expect(userRepoMocks.setAvatarUrl.mock.calls[0]).toEqual([
      CUSTOMER_ID,
      row.url ?? "",
    ]);
  });

  test("rejects catalog photos and foreign uploads", async () => {
    mediaStubs.assetById = makeMediaRow({ scope: "service" });
    const catalog = await setMyAvatar(makePublicUser(), "asset-1");
    expect(catalog).toMatchObject({ ok: false, status: 403 });

    mediaStubs.assetById = makeMediaRow({ created_by: "someone-else" });
    const foreign = await setMyAvatar(makePublicUser(), "asset-1");
    expect(foreign).toMatchObject({ ok: false, status: 403 });
    expect(userRepoMocks.setAvatarUrl.mock.calls.length).toBe(0);
  });
});
