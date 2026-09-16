import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makePublicUser, readJsonBody } from "../helpers/auth.fixtures";
import { jpegBytes } from "../helpers/media.fixtures";
import {
  authorizationMocks,
  avatarServiceMocks,
  mediaRouteStubs,
  mediaServiceMocks,
  mediaStorageMocks,
  okMediaAsset,
  resetRouteMocks,
  routeStubs,
} from "../helpers/route-mocks";

// Route suites stub every side effect: the auth guard, the media/avatar
// services and (for serving) the disk. Handlers only parse, call and
// shape, so no database is touched here.
mock.module("@/lib/auth/authorization", () => authorizationMocks);
mock.module("@/lib/media/media.service", () => mediaServiceMocks);
mock.module("@/lib/media/avatar.service", () => avatarServiceMocks);
mock.module("@/lib/media/media-storage", () => mediaStorageMocks);

import { POST as avatarPost } from "@/app/api/account/avatar/route";
import { GET as mediaGet } from "@/app/api/media/[...key]/route";
import { DELETE as mediaDelete } from "@/app/api/media/[assetId]/route";
import { POST as mediaPost } from "@/app/api/media/route";

function uploadRequest(fields?: Record<string, string>): Request {
  const form = new FormData();
  form.set(
    "file",
    new File([Uint8Array.from(jpegBytes(128))], "avatar.jpg", {
      type: "image/jpeg",
    }),
  );
  form.set("scope", "avatar");
  form.set("ownerType", "avatar");
  form.set("ownerId", "11111111-1111-4111-8111-111111111111");
  for (const [key, value] of Object.entries(fields ?? {})) {
    form.set(key, value);
  }
  return new Request("http://localhost/api/media", {
    method: "POST",
    body: form,
  });
}

function jsonPost(path: string, body: unknown): Request {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  resetRouteMocks();
});

describe("POST /api/media", () => {
  test("returns 401 without calling the service when logged out", async () => {
    routeStubs.bookingUser = null;

    const res = await mediaPost(uploadRequest());

    expect(res.status).toBe(401);
    expect(mediaServiceMocks.createMediaAsset.mock.calls.length).toBe(0);
  });

  test("returns 201 with the asset on success", async () => {
    routeStubs.bookingUser = makePublicUser();

    const res = await mediaPost(uploadRequest());

    expect(res.status).toBe(201);
    expect(await readJsonBody(res)).toMatchObject({
      asset: { assetId: okMediaAsset().assetId },
    });
    expect(mediaServiceMocks.createMediaAsset.mock.calls.length).toBe(1);
  });

  test("rejects requests without a file before the service", async () => {
    routeStubs.bookingUser = makePublicUser();
    const form = new FormData();
    form.set("scope", "avatar");

    const res = await mediaPost(
      new Request("http://localhost/api/media", { method: "POST", body: form }),
    );

    expect(res.status).toBe(400);
    expect(mediaServiceMocks.createMediaAsset.mock.calls.length).toBe(0);
  });

  test("passes service errors through with their status", async () => {
    routeStubs.bookingUser = makePublicUser();
    mediaRouteStubs.mediaCreateResult = {
      ok: false,
      status: 403,
      errors: { form: "Bạn không có quyền tải ảnh cho nhóm này." },
    };

    const res = await mediaPost(uploadRequest());

    expect(res.status).toBe(403);
    expect(await readJsonBody(res)).toMatchObject({
      errors: { form: "Bạn không có quyền tải ảnh cho nhóm này." },
    });
  });
});

describe("GET /api/media/[...key]", () => {
  test("serves stored bytes with a long immutable cache", async () => {
    const key = "avatar/2026-09/some-uuid.jpg";
    mediaStorageMocks.readAssetFile.mockImplementationOnce(async () =>
      jpegBytes(64),
    );

    const res = await mediaGet(new Request("http://localhost/x"), {
      params: Promise.resolve({ key: key.split("/") }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/jpeg");
    expect(res.headers.get("Cache-Control")).toContain("immutable");
  });

  test("rejects traversal keys with 404 without touching disk", async () => {
    const res = await mediaGet(new Request("http://localhost/x"), {
      params: Promise.resolve({ key: ["..", "secret"] }),
    });

    expect(res.status).toBe(404);
    expect(mediaStorageMocks.readAssetFile.mock.calls.length).toBe(0);
  });
});

describe("DELETE /api/media/[assetId]", () => {
  test("returns the deleted asset id on success", async () => {
    routeStubs.bookingUser = makePublicUser();

    const res = await mediaDelete(new Request("http://localhost/x"), {
      params: Promise.resolve({ assetId: okMediaAsset().assetId }),
    });

    expect(res.status).toBe(200);
    expect(await readJsonBody(res)).toMatchObject({
      assetId: okMediaAsset().assetId,
    });
  });

  test("passes service errors through with their status", async () => {
    routeStubs.bookingUser = makePublicUser();
    mediaRouteStubs.mediaDeleteResult = {
      ok: false,
      status: 403,
      errors: { form: "Bạn không có quyền xóa ảnh này." },
    };

    const res = await mediaDelete(new Request("http://localhost/x"), {
      params: Promise.resolve({ assetId: "asset-1" }),
    });

    expect(res.status).toBe(403);
  });
});

describe("POST /api/account/avatar", () => {
  test("returns the new avatar URL on success", async () => {
    routeStubs.bookingUser = makePublicUser();

    const res = await avatarPost(jsonPost("/api/account/avatar", {}));

    expect(res.status).toBe(200);
    expect(await readJsonBody(res)).toMatchObject({
      avatarUrl: okMediaAsset().url,
    });
    expect(avatarServiceMocks.setMyAvatar.mock.calls.length).toBe(1);
  });

  test("passes service errors through with their status", async () => {
    routeStubs.bookingUser = makePublicUser();
    mediaRouteStubs.avatarResult = {
      ok: false,
      status: 403,
      errors: { form: "Ảnh này không dùng được làm ảnh đại diện." },
    };

    const res = await avatarPost(
      jsonPost("/api/account/avatar", { assetId: "asset-1" }),
    );

    expect(res.status).toBe(403);
  });
});
