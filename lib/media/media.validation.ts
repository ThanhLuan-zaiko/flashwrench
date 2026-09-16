import type { MediaFieldErrors, MediaScope } from "./media.types";

// Upload guardrails. Pure functions shared by the crop dialog (instant
// feedback) and the POST /api/media service (source of truth).

export const MEDIA_SCOPES: MediaScope[] = [
  "avatar",
  "service",
  "category",
  "part",
  "booking",
  "emergency",
  "review",
  "misc",
];

export const MEDIA_MIME_ALLOWLIST = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedMediaMime = (typeof MEDIA_MIME_ALLOWLIST)[number];

const EXT_BY_MIME: Record<AllowedMediaMime, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const MEDIA_ALT_MAX = 140;
export const MEDIA_DIMENSION_MIN = 1;
export const MEDIA_DIMENSION_MAX = 12000;

export function defaultMaxUploadBytes(): number {
  const raw = Number(process.env.MEDIA_MAX_MB ?? 8);
  const mb =
    Number.isFinite(raw) && raw > 0 ? Math.min(Math.trunc(raw), 50) : 8;
  return mb * 1024 * 1024;
}

export function isMediaScope(value: unknown): value is MediaScope {
  return (
    typeof value === "string" && (MEDIA_SCOPES as string[]).includes(value)
  );
}

export function isAllowedMediaMime(value: unknown): value is AllowedMediaMime {
  return (
    typeof value === "string" &&
    (MEDIA_MIME_ALLOWLIST as readonly string[]).includes(value)
  );
}

export function extensionForMime(mime: AllowedMediaMime): string {
  return EXT_BY_MIME[mime];
}

// Magic-byte sniff so a renamed .exe cannot pass as image/jpeg.
// Compares raw bytes (no Buffer methods), so the same check runs on
// the server (Buffer) and in the crop dialog (Uint8Array): JPEG SOI,
// PNG signature, or RIFF....WEBP.
export function sniffImageMime(buffer: Uint8Array): AllowedMediaMime | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  const RIFF = [0x52, 0x49, 0x46, 0x46];
  const WEBP = [0x57, 0x45, 0x42, 0x50];
  if (
    buffer.length >= 12 &&
    RIFF.every((byte, index) => buffer[index] === byte) &&
    WEBP.every((byte, index) => buffer[index + 8] === byte)
  ) {
    return "image/webp";
  }
  return null;
}

export function validateAltText(
  value: unknown,
): { alt: string } | { error: string } {
  if (value === undefined || value === null) return { alt: "" };
  if (typeof value !== "string") {
    return { error: "Mô tả ảnh tối đa 140 ký tự." };
  }
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length > MEDIA_ALT_MAX) {
    return { error: "Mô tả ảnh tối đa 140 ký tự." };
  }
  return { alt: trimmed };
}

export function validateDimensions(
  width: unknown,
  height: unknown,
): { width: number | null; height: number | null } | { error: string } {
  const message = "Kích thước ảnh không hợp lệ.";
  if (
    (width === undefined || width === null) &&
    (height === undefined || height === null)
  ) {
    return { width: null, height: null };
  }
  const w = typeof width === "string" ? Number(width) : width;
  const h = typeof height === "string" ? Number(height) : height;
  if (
    typeof w !== "number" ||
    typeof h !== "number" ||
    !Number.isInteger(w) ||
    !Number.isInteger(h) ||
    w < MEDIA_DIMENSION_MIN ||
    h < MEDIA_DIMENSION_MIN ||
    w > MEDIA_DIMENSION_MAX ||
    h > MEDIA_DIMENSION_MAX
  ) {
    return { error: message };
  }
  return { width: w, height: h };
}

export function checkUploadHeaders(input: {
  scope: unknown;
  mime: unknown;
  sizeBytes: number;
  maxBytes?: number;
}): MediaFieldErrors | null {
  const errors: MediaFieldErrors = {};
  if (!isMediaScope(input.scope)) {
    errors.scope = "Nhóm ảnh không hợp lệ.";
  }
  if (!isAllowedMediaMime(input.mime)) {
    errors.file = "Chỉ nhận ảnh JPEG, PNG hoặc WebP.";
  }
  const max = input.maxBytes ?? defaultMaxUploadBytes();
  if (!Number.isFinite(input.sizeBytes) || input.sizeBytes <= 0) {
    errors.file = errors.file ?? "File ảnh trống.";
  } else if (input.sizeBytes > max) {
    errors.file = `Ảnh tối đa ${Math.round(max / 1024 / 1024)}MB.`;
  }
  return Object.keys(errors).length > 0 ? errors : null;
}
