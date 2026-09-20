import type { UserRole } from "@/lib/auth/user.types";

// Shared wire protocol for the realtime gateway. Both the Bun server and
// browser clients speak these messages, so every future feature (booking
// tracking, rescue dispatch, chat, notifications) reuses the same topics
// and permission checks instead of inventing its own socket layer.

export type RealtimeUser = { id: string; role: UserRole };

export const STAFF_PASSWORDS_TOPIC = "staff-passwords";
export const SERVICE_CATALOG_TOPIC = "service-catalog";
export const PARTS_CATALOG_TOPIC = "parts-catalog";
export const OPERATIONS_TOPIC = "operations";
export const ADMIN_USERS_TOPIC = "admin-users";
export const COMPLAINTS_TOPIC = "complaints";
export const MECHANIC_DIRECTORY_TOPIC = "mechanic-directory";

export function serviceCatalogTopic(): string {
  return SERVICE_CATALOG_TOPIC;
}

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

export function bookingIdFromTopic(topic: string): string | null {
  return /^booking:([a-z0-9_-]+)(?::chat)?$/.exec(topic)?.[1] ?? null;
}

// Inbox event kinds delivered on `user:{mechanicId}` when a customer
// books. The mechanic client filters on `kind` so lock notices and
// booking notices share one socket subscription without colliding.
export const BOOKING_CREATED_EVENT_KIND = "booking-created";
export const BOOKING_ASSIGNED_EVENT_KIND = "booking-assigned";

export type BookingInboxEvent = {
  kind: typeof BOOKING_CREATED_EVENT_KIND | typeof BOOKING_ASSIGNED_EVENT_KIND;
  bookingId: string;
  status: string;
};

// Parse one inbox payload into a booking notice, or null for anything
// else (lock notices, chat echoes, malformed bodies). Narrow on purpose:
// the shell must never toast or refetch on an event it cannot name.
export function parseBookingInboxEvent(
  payload: unknown,
): BookingInboxEvent | null {
  if (typeof payload !== "object" || payload === null) return null;
  const body = payload as Record<string, unknown>;
  const kind = body.kind;
  if (
    kind !== BOOKING_CREATED_EVENT_KIND &&
    kind !== BOOKING_ASSIGNED_EVENT_KIND
  ) {
    return null;
  }
  const bookingId = body.bookingId;
  const status = body.status;
  if (typeof bookingId !== "string" || bookingId.length === 0) return null;
  if (typeof status !== "string" || status.length === 0) return null;
  return { kind, bookingId, status };
}

export type DomainEvent = {
  kind:
    | "booking-created"
    | "booking-assigned"
    | "booking-updated"
    | "payment-recorded"
    | "review-created"
    | "vehicle-updated"
    | "mechanic-updated"
    | "user-updated"
    | "complaint-updated"
    | "orders-updated"
    | "order-updated";
  bookingId?: string;
  orderId?: string;
  userId?: string;
  status?: string;
};

const DOMAIN_EVENT_KINDS = new Set<DomainEvent["kind"]>([
  "booking-created",
  "booking-assigned",
  "booking-updated",
  "payment-recorded",
  "review-created",
  "vehicle-updated",
  "mechanic-updated",
  "user-updated",
  "complaint-updated",
  "orders-updated",
  "order-updated",
]);

const LEGACY_BOOKING_STATUS_TYPE = "booking-status";

function optionalField(value: unknown): string | undefined | null {
  if (value === undefined) return undefined;
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function parseDomainEvent(payload: unknown): DomainEvent | null {
  if (
    typeof payload !== "object" ||
    payload === null ||
    Array.isArray(payload)
  ) {
    return null;
  }
  const body = payload as Record<string, unknown>;
  let kind: DomainEvent["kind"];
  if (DOMAIN_EVENT_KINDS.has(body.kind as DomainEvent["kind"])) {
    kind = body.kind as DomainEvent["kind"];
  } else if (body.type === LEGACY_BOOKING_STATUS_TYPE) {
    kind = "booking-updated";
  } else {
    return null;
  }
  const bookingId = optionalField(body.bookingId);
  const orderId = optionalField(body.orderId);
  const userId = optionalField(body.userId);
  const status = optionalField(body.status);
  if (
    bookingId === null ||
    orderId === null ||
    userId === null ||
    status === null
  )
    return null;
  const event: DomainEvent = { kind };
  if (bookingId !== undefined) event.bookingId = bookingId;
  if (orderId !== undefined) event.orderId = orderId;
  if (userId !== undefined) event.userId = userId;
  if (status !== undefined) event.status = status;
  return event;
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
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return null;
  }
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
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return null;
  }
  const msg = data as Record<string, unknown>;
  switch (msg.type) {
    case "event": {
      if (!isValidTopic(msg.topic) || msg.payload === undefined) return null;
      if (msg.from !== undefined && typeof msg.from !== "string") return null;
      const event: ServerMessage = {
        type: "event",
        topic: msg.topic,
        payload: msg.payload,
      };
      if (typeof msg.from === "string") event.from = msg.from;
      return event;
    }
    case "subscribed":
    case "unsubscribed":
      return isValidTopic(msg.topic)
        ? { type: msg.type, topic: msg.topic }
        : null;
    case "pong":
      return { type: "pong" };
    case "error":
      return typeof msg.message === "string"
        ? { type: "error", message: msg.message }
        : null;
    default:
      return null;
  }
}

type TopicKind =
  | "staff-passwords"
  | "service-catalog"
  | "parts-catalog"
  | "operations"
  | "admin-users"
  | "complaints"
  | "mechanic-directory"
  | "user"
  | "booking"
  | "booking-chat"
  | "emergency-zone"
  | "unknown";

const USER_TOPIC_PATTERN = /^user:[a-z0-9_-]+$/;
const BOOKING_TOPIC_PATTERN = /^booking:[a-z0-9_-]+$/;
const BOOKING_CHAT_TOPIC_PATTERN = /^booking:[a-z0-9_-]+:chat$/;
const EMERGENCY_ZONE_TOPIC_PATTERN = /^emergency:zone:[a-z0-9_-]+$/;

function topicKind(topic: string): TopicKind {
  if (topic === STAFF_PASSWORDS_TOPIC) return "staff-passwords";
  if (topic === SERVICE_CATALOG_TOPIC) return "service-catalog";
  if (topic === PARTS_CATALOG_TOPIC) return "parts-catalog";
  if (topic === OPERATIONS_TOPIC) return "operations";
  if (topic === ADMIN_USERS_TOPIC) return "admin-users";
  if (topic === COMPLAINTS_TOPIC) return "complaints";
  if (topic === MECHANIC_DIRECTORY_TOPIC) return "mechanic-directory";
  if (USER_TOPIC_PATTERN.test(topic)) return "user";
  if (BOOKING_CHAT_TOPIC_PATTERN.test(topic)) return "booking-chat";
  if (BOOKING_TOPIC_PATTERN.test(topic)) return "booking";
  if (EMERGENCY_ZONE_TOPIC_PATTERN.test(topic)) return "emergency-zone";
  return "unknown";
}

// Who may listen. Booking topics are coarse in v1 (any logged-in user);
// tighten with a participant lookup when booking tracking lands.
// The service catalog is public so guests on /services see price updates
// without logging in; events carry only a refresh signal, never secrets.
export function canSubscribe(
  user: RealtimeUser | null,
  topic: string,
): boolean {
  if (!isValidTopic(topic)) return false;
  const kind = topicKind(topic);
  if (
    kind === "service-catalog" ||
    kind === "parts-catalog" ||
    kind === "mechanic-directory"
  )
    return true;
  if (!user) return false;
  switch (kind) {
    case "staff-passwords":
    case "admin-users":
    case "complaints":
      return user.role === "admin";
    case "operations":
      return user.role === "admin" || user.role === "dispatcher";
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

// Who may send. Server-only topics (staff-passwords, service-catalog, user
// inbox, booking state) reject client publishes; the Next.js routes publish
// there through the gateway /publish endpoint instead.
export function canPublish(user: RealtimeUser | null, topic: string): boolean {
  if (!user || !isValidTopic(topic)) return false;
  return topicKind(topic) === "booking-chat";
}

// Internal secret between Next.js routes and the gateway. Reuses
// AUTH_SECRET so no extra secret is needed; REALTIME_SECRET overrides it
// for split-host deployments. Dev falls back to an insecure default.
export function resolvePublishSecret(): string {
  const secret = process.env.REALTIME_SECRET ?? process.env.AUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing REALTIME_SECRET or AUTH_SECRET.");
  }
  return "dev-only-insecure-realtime-secret";
}
