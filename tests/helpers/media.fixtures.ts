import type { MediaAssetRow } from "@/lib/media/media.types";

// Builders for the media suites. Byte builders carry just enough magic
// header for the sniff check; sizes stay tiny on purpose.

export const AVATAR_ASSET_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

export function jpegBytes(size = 64): Buffer {
  const buffer = Buffer.alloc(size, 0);
  buffer[0] = 0xff;
  buffer[1] = 0xd8;
  buffer[2] = 0xff;
  return buffer;
}

export function pngBytes(size = 64): Buffer {
  const buffer = Buffer.alloc(size, 0);
  buffer[0] = 0x89;
  buffer[1] = 0x50;
  buffer[2] = 0x4e;
  buffer[3] = 0x47;
  return buffer;
}

export function webpBytes(size = 64): Buffer {
  const buffer = Buffer.alloc(size, 0);
  buffer.write("RIFF", 0, "ascii");
  buffer.write("WEBP", 8, "ascii");
  return buffer;
}

export function exeBytes(size = 64): Buffer {
  const buffer = Buffer.alloc(size, 0);
  buffer.write("MZ", 0, "ascii");
  return buffer;
}

export function makeMediaRow(
  overrides?: Partial<MediaAssetRow>,
): MediaAssetRow {
  return {
    asset_id: AVATAR_ASSET_ID,
    owner_type: "avatar",
    owner_id: "11111111-1111-4111-8111-111111111111",
    scope: "avatar",
    file_path: "avatar/2026-09/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.jpg",
    url: "/api/media/avatar/2026-09/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.jpg",
    mime: "image/jpeg",
    size_bytes: 64,
    width: 800,
    height: 600,
    alt: "",
    created_by: "11111111-1111-4111-8111-111111111111",
    created_at: new Date("2026-09-16T00:00:00.000Z"),
    ...overrides,
  };
}
