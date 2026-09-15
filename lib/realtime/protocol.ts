import type { UserRole } from "@/lib/auth/user.types";

// Shared wire protocol for the realtime gateway. Both the Bun server and
// browser clients speak these messages, so every future feature (booking
// tracking, rescue dispatch, chat, notifications) reuses the same topics
// and permission checks instead of inventing its own socket layer.

export type RealtimeUser = { id: string; role: UserRole };

export const STAFF_PASSWORDS_TOPIC = "staff-passwords";

export function userTopic(userId: string): string {
  return `user:${userId}`;
}

export function bookingTopic(bookingId: string): string {
  return `booking:${bookingId}`;
}

export function bookingChatTopic(bookingId: string): string {
  return `booking:${bookingId}:chat`;
}

export function emergencyZoneTopic(zoneId: string): string {
  return `emergency:zone:${zoneId}`;
}

const TOPIC_PATTERN = /^[a-z0-9:_-]{1,120}$/;

export function isValidTopic(topic: unknown): topic is string {
  return typeof topic === "string" && TOPIC_PATTERN.test(topic);
}

export type ClientMessage =
  | { type: "subscribe"; topic: string }
  | { type: "unsubscribe"; topic: string }
  | { type: "publish"; topic: string; payload: unknown }
  | { type: "ping" };

export function parseClientMessage(raw: unknown): ClientMessage | null {
  if (typeof raw !== "string") return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null) return null;
  const msg = data as Record<string, unknown>;
  switch (msg.type) {
    case "ping":
      return { type: "ping" };
    case "subscribe":
    case "unsubscribe":
      return isValidTopic(msg.topic)
        ? { type: msg.type, topic: msg.topic }
        : null;
    case "publish":
      if (!isValidTopic(msg.topic) || msg.payload === undefined) return null;
      return { type: "publish", topic: msg.topic, payload: msg.payload };
    default:
      return null;
  }
}

export type ServerMessage =
  | { type: "event"; topic: string; payload: unknown; from?: string }
  | { type: "subscribed"; topic: string }
  | { type: "unsubscribed"; topic: string }
  | { type: "pong" }
  | { type: "error"; message: string };

export function encodeServerMessage(msg: ServerMessage): string {
  return JSON.stringify(msg);
}

export function parseServerMessage(raw: unknown): ServerMessage | null {
  if (typeof raw !== "string") return null;
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    if (typeof data.type !== "string") return null;
    return data as ServerMessage;
  } catch {
    return null;
  }
}

type TopicKind =
  | "staff-passwords"
  | "user"
  | "booking"
  | "booking-chat"
  | "emergency-zone"
  | "unknown";

function topicKind(topic: string): TopicKind {
  if (topic === STAFF_PASSWORDS_TOPIC) return "staff-passwords";
  if (topic.startsWith("user:")) return "user";
  if (topic.startsWith("booking:") && topic.endsWith(":chat")) {
    return "booking-chat";
  }
  if (topic.startsWith("booking:")) return "booking";
  if (topic.startsWith("emergency:zone:")) return "emergency-zone";
  return "unknown";
}

// Who may listen. Booking topics are coarse in v1 (any logged-in user);
// tighten with a participant lookup when booking tracking lands.
export function canSubscribe(
  user: RealtimeUser | null,
  topic: string,
): boolean {
  if (!user || !isValidTopic(topic)) return false;
  switch (topicKind(topic)) {
    case "staff-passwords":
      return user.role === "admin";
    case "user":
      return user.role === "admin" || topic === userTopic(user.id);
    case "booking":
    case "booking-chat":
      return true;
    case "emergency-zone":
      return user.role !== "customer";
    default:
      return false;
  }
}

// Who may send. Server-only topics (staff-passwords, user inbox, booking
// state) reject client publishes; the Next.js routes publish there through
// the gateway /publish endpoint instead.
export function canPublish(user: RealtimeUser | null, topic: string): boolean {
  if (!user || !isValidTopic(topic)) return false;
  switch (topicKind(topic)) {
    case "booking-chat":
      return true;
    case "emergency-zone":
      return user.role !== "customer";
    default:
      return false;
  }
}

// Internal secret between Next.js routes and the gateway. Reuses
// AUTH_SECRET so no extra secret is needed; REALTIME_SECRET overrides it
// for split-host deployments. Dev falls back to an insecure default.
export function resolvePublishSecret(): string {
  return (
    process.env.REALTIME_SECRET ??
    process.env.AUTH_SECRET ??
    "dev-only-insecure-realtime-secret"
  );
}
