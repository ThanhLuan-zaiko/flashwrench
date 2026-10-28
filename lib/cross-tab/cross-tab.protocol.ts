// Wire format for same-browser tab-to-tab signals. Messages are hints only:
// a receiving tab refetches the real data over HTTPS and never trusts the
// payload for anything beyond "what to refresh" and "what to tell the user".
// Framework-free so it can be unit-tested without a DOM.
import {
  type GuestRecordType,
  isGuestRecordType,
} from "@/lib/guest-access/guest-access.types";
import { isUuid } from "@/lib/validation";

export const CROSS_TAB_CHANNEL = "flashwrench-sync";
/** localStorage key for browsers without BroadcastChannel. */
export const CROSS_TAB_STORAGE_KEY = "flashwrench-sync-event";

const PROTOCOL_VERSION = 1;
// A booking carries a handful of services; anything longer is not ours.
const MAX_SERVICE_IDS = 20;

export type RecordCreatedEvent = {
  v: typeof PROTOCOL_VERSION;
  kind: "record-created";
  recordType: GuestRecordType;
  recordId: string;
  /** Booked service ids, so other tabs drop them from their selection. */
  serviceIds: string[];
};

export type CartChangedEvent = {
  v: typeof PROTOCOL_VERSION;
  kind: "cart-changed";
};

export type CrossTabEvent = RecordCreatedEvent | CartChangedEvent;

export function recordCreatedEvent(
  recordType: GuestRecordType,
  recordId: string,
  serviceIds: readonly string[] = [],
): RecordCreatedEvent {
  return {
    v: PROTOCOL_VERSION,
    kind: "record-created",
    recordType,
    recordId,
    serviceIds: serviceIds.filter(isUuid).slice(0, MAX_SERVICE_IDS),
  };
}

export const CART_CHANGED_EVENT: CartChangedEvent = {
  v: PROTOCOL_VERSION,
  kind: "cart-changed",
};

function parseServiceIds(value: unknown): string[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_SERVICE_IDS) return null;
  return value.every(isUuid) ? [...value] : null;
}

/**
 * Validates an incoming message. Anything from another app version, a
 * browser extension or a tampered storage value is dropped whole.
 */
export function parseCrossTabEvent(raw: unknown): CrossTabEvent | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return null;
  }
  const message = raw as Record<string, unknown>;
  if (message.v !== PROTOCOL_VERSION) return null;
  if (message.kind === "cart-changed") return CART_CHANGED_EVENT;
  if (message.kind !== "record-created") return null;
  if (!isGuestRecordType(message.recordType)) return null;
  if (!isUuid(message.recordId)) return null;
  const serviceIds = parseServiceIds(message.serviceIds);
  if (!serviceIds) return null;
  return {
    v: PROTOCOL_VERSION,
    kind: "record-created",
    recordType: message.recordType,
    recordId: message.recordId,
    serviceIds,
  };
}

/** Parses the localStorage fallback envelope `{ event, nonce }`. */
export function parseStoredCrossTabEvent(
  value: string | null,
): CrossTabEvent | null {
  if (!value) return null;
  try {
    const envelope: unknown = JSON.parse(value);
    if (typeof envelope !== "object" || envelope === null) return null;
    return parseCrossTabEvent((envelope as { event?: unknown }).event);
  } catch {
    return null;
  }
}

export type CrossTabNotice = { title: string; description: string };

const RECORD_NOTICES: Record<GuestRecordType, CrossTabNotice> = {
  booking: {
    title: "Lịch hẹn vừa được đặt ở tab khác",
    description:
      "Các dịch vụ đã đặt được bỏ khỏi danh sách chọn ở tab này để tránh đặt trùng.",
  },
  order: {
    title: "Đơn hàng vừa được đặt ở tab khác",
    description: "Giỏ hàng ở tab này đã được cập nhật theo đơn mới.",
  },
  rescue: {
    title: "Yêu cầu cứu hộ vừa được gửi ở tab khác",
    description: "Bạn có thể xem lại yêu cầu trong mục Đơn của bạn.",
  },
};

/** Toast copy for a receiving tab; silent events return null. */
export function crossTabNotice(event: CrossTabEvent): CrossTabNotice | null {
  if (event.kind !== "record-created") return null;
  return RECORD_NOTICES[event.recordType];
}
