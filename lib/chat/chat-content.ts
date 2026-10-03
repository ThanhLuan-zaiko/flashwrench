import type { ChatMessageKind } from "./chat.types";

// Pure content guards for multi-kind chat messages. Client-safe (no DB):
// the API route, the service, the composer and the unit suite share these
// so validation never drifts between layers.
export const CHAT_TEXT_MAX = 2000;

const IMAGE_URL_PREFIX = "/api/media/";
const IMAGE_URL_MAX = 512;

export function parseMessageKind(value: unknown): ChatMessageKind | null {
  if (value === "text" || value === "image" || value === "location") {
    return value;
  }
  return null;
}

// Legacy rows store kind "text" or null; unknown future kinds degrade to
// the plain text bubble instead of breaking the conversation view.
export function normalizeMessageKind(value: unknown): ChatMessageKind {
  return parseMessageKind(value) ?? "text";
}

// Image bodies must reference our own immutable uploads: no external URLs
// (tracking pixels), no data: payloads, no whitespace smuggling.
export function isChatImageUrl(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > IMAGE_URL_PREFIX.length &&
    value.length <= IMAGE_URL_MAX &&
    value.startsWith(IMAGE_URL_PREFIX) &&
    !/\s/.test(value)
  );
}

export type ChatLocation = { lat: number; lng: number };

export function parseChatLocation(value: unknown): ChatLocation | null {
  if (typeof value !== "string") return null;
  const parts = value.split(",");
  if (parts.length !== 2) return null;
  const rawLat = parts[0]?.trim();
  const rawLng = parts[1]?.trim();
  if (!rawLat || !rawLng) return null;
  const lat = Number(rawLat);
  const lng = Number(rawLng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

export function formatChatLocation(point: ChatLocation): string {
  return `${point.lat},${point.lng}`;
}

export function chatLocationMapUrl(point: ChatLocation): string {
  return `https://www.openstreetmap.org/?mlat=${point.lat}&mlon=${point.lng}#map=16/${point.lat}/${point.lng}`;
}

const TEXT_PREVIEW_MAX = 120;

// Inbox/thread preview line per kind. Keep in sync with the composer copy.
export function chatContentPreview(
  kind: ChatMessageKind,
  body: string,
): string {
  if (kind === "image") return "Đã gửi một hình ảnh";
  if (kind === "location") return "Đã chia sẻ vị trí";
  return body.length > TEXT_PREVIEW_MAX
    ? `${body.slice(0, TEXT_PREVIEW_MAX - 3)}...`
    : body;
}
