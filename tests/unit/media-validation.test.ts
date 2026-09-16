import { describe, expect, test } from "bun:test";
import {
  checkUploadHeaders,
  defaultMaxUploadBytes,
  extensionForMime,
  isAllowedMediaMime,
  isMediaScope,
  sniffImageMime,
  validateAltText,
  validateDimensions,
} from "@/lib/media/media.validation";
import {
  buildAssetKey,
  isSafeAssetKey,
  publicAssetUrl,
} from "@/lib/media/media-paths";
import {
  exeBytes,
  jpegBytes,
  pngBytes,
  webpBytes,
} from "../helpers/media.fixtures";

// Pure guards behind POST /api/media and the crop dialog: same rules on
// both sides, so the dialog never promises what the service rejects.
// No React, no mocks.

describe("media scopes and mimes", () => {
  test("accepts the eight storage scopes and the three image mimes", () => {
    for (const scope of [
      "avatar",
      "service",
      "category",
      "part",
      "booking",
      "emergency",
      "review",
      "misc",
    ]) {
      expect(isMediaScope(scope)).toBe(true);
    }
    expect(isMediaScope("invoices")).toBe(false);
    expect(isAllowedMediaMime("image/jpeg")).toBe(true);
    expect(isAllowedMediaMime("image/png")).toBe(true);
    expect(isAllowedMediaMime("image/webp")).toBe(true);
    expect(isAllowedMediaMime("image/gif")).toBe(false);
    expect(extensionForMime("image/jpeg")).toBe("jpg");
    expect(extensionForMime("image/webp")).toBe("webp");
  });

  test("sniffs magic bytes for all allowlisted kinds", () => {
    expect(sniffImageMime(jpegBytes())).toBe("image/jpeg");
    expect(sniffImageMime(pngBytes())).toBe("image/png");
    expect(sniffImageMime(webpBytes())).toBe("image/webp");
    expect(sniffImageMime(exeBytes())).toBeNull();
    expect(sniffImageMime(Buffer.alloc(0))).toBeNull();
  });

  test("rejects empty and oversized uploads", () => {
    expect(
      checkUploadHeaders({ scope: "avatar", mime: "image/jpeg", sizeBytes: 0 }),
    ).toMatchObject({ file: expect.stringContaining("trống") });
    expect(
      checkUploadHeaders({
        scope: "avatar",
        mime: "image/jpeg",
        sizeBytes: defaultMaxUploadBytes() + 1,
      }),
    ).toMatchObject({ file: expect.stringContaining("tối đa") });
    expect(
      checkUploadHeaders({
        scope: "avatar",
        mime: "image/jpeg",
        sizeBytes: 100,
      }),
    ).toBeNull();
  });

  test("validates alt text and dimensions", () => {
    expect(validateAltText(undefined)).toEqual({ alt: "" });
    expect(validateAltText("x".repeat(141))).toMatchObject({
      error: expect.stringContaining("140"),
    });
    expect(validateDimensions(undefined, undefined)).toEqual({
      width: null,
      height: null,
    });
    expect(validateDimensions("800", "600")).toEqual({
      width: 800,
      height: 600,
    });
    expect(validateDimensions(0, 600)).toMatchObject({
      error: expect.any(String),
    });
    expect(validateDimensions(800, null)).toMatchObject({
      error: expect.any(String),
    });
  });
});

describe("media storage paths", () => {
  test("builds scoped monthly keys with server-generated names", () => {
    const key = buildAssetKey(
      "avatar",
      "some-uuid",
      "jpg",
      new Date("2026-09-16T00:00:00.000Z"),
    );
    expect(key).toBe("avatar/2026-09/some-uuid.jpg");
    expect(publicAssetUrl(key)).toBe(`/api/media/${key}`);
  });

  test("rejects traversal and malformed keys", () => {
    expect(isSafeAssetKey("avatar/2026-09/some-uuid.jpg")).toBe(true);
    expect(isSafeAssetKey("../secret")).toBe(false);
    expect(isSafeAssetKey("avatar/2026-09/../../x.jpg")).toBe(false);
    expect(isSafeAssetKey("avatar/2026-09/a.jpg/extra")).toBe(false);
    expect(isSafeAssetKey("AVATAR/2026-09/a.jpg")).toBe(false);
    expect(isSafeAssetKey(null)).toBe(false);
  });
});
