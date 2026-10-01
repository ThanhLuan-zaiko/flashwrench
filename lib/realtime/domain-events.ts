// Domain event payloads fanned out on gateway topics: a whitelisted `kind`
// plus optional entity ids. Server routes publish them through
// publishRealtimeEvent; client hooks parse them before invalidating caches.
// Kept separate from protocol.ts (which is capped by the file-size rule) —
// protocol re-exports these so imports stay stable.
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
    | "order-updated"
    | "part-updated"
    | "promotion-updated"
    | "voucher-granted"
    | "voucher-used"
    | "voucher-revoked"
    | "rescue-created"
    | "rescue-assigned"
    | "rescue-updated"
    | "chat-message"
    | "chat-read";
  bookingId?: string;
  orderId?: string;
  partId?: string;
  userId?: string;
  rescueId?: string;
  threadId?: string;
  senderId?: string;
  messageId?: string;
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
  "part-updated",
  "promotion-updated",
  "voucher-granted",
  "voucher-used",
  "voucher-revoked",
  "rescue-created",
  "rescue-assigned",
  "rescue-updated",
  "chat-message",
  "chat-read",
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
  const partId = optionalField(body.partId);
  const userId = optionalField(body.userId);
  const rescueId = optionalField(body.rescueId);
  const threadId = optionalField(body.threadId);
  const senderId = optionalField(body.senderId);
  const messageId = optionalField(body.messageId);
  const status = optionalField(body.status);
  if (
    bookingId === null ||
    orderId === null ||
    partId === null ||
    userId === null ||
    rescueId === null ||
    threadId === null ||
    senderId === null ||
    messageId === null ||
    status === null
  )
    return null;
  const event: DomainEvent = { kind };
  if (bookingId !== undefined) event.bookingId = bookingId;
  if (orderId !== undefined) event.orderId = orderId;
  if (partId !== undefined) event.partId = partId;
  if (userId !== undefined) event.userId = userId;
  if (rescueId !== undefined) event.rescueId = rescueId;
  if (threadId !== undefined) event.threadId = threadId;
  if (senderId !== undefined) event.senderId = senderId;
  if (messageId !== undefined) event.messageId = messageId;
  if (status !== undefined) event.status = status;
  return event;
}
