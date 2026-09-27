import type { OrderHistoryEntry, OrderStatus } from "./orders.types";

// A delivered order may be sent back within 3 days of the handover. The
// window starts at the newest "delivered" history entry — goods in hand —
// so slow shipping never eats the customer's review time.
export const RETURN_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;
export const RETURN_IMAGE_MAX = 5;
export const RETURN_REASON_MAX = 500;

// Evidence photos must be served by the app's own media store, so a
// request cannot point at arbitrary remote URLs.
export function isReturnImageUrl(url: string): boolean {
  return url.startsWith("/api/media/");
}

type HistoryLike = { newStatus: string; changedAt: string | Date | null };

export function latestDeliveredAt(history: HistoryLike[]): Date | null {
  let latest: Date | null = null;
  for (const entry of history) {
    if (entry.newStatus !== "delivered" || !entry.changedAt) continue;
    const at = new Date(entry.changedAt);
    if (!latest || at > latest) latest = at;
  }
  return latest;
}

export function returnWindowOpen(deliveredAt: Date | null, now: Date): boolean {
  return (
    deliveredAt !== null &&
    now.getTime() - deliveredAt.getTime() <= RETURN_WINDOW_MS
  );
}

type ReturnableOrder = {
  status: OrderStatus;
  history: OrderHistoryEntry[];
};

// Customer-side gate mirroring the service check: delivered, still inside
// the 3-day window. The server re-verifies with its own clock.
export function canCustomerReturn(order: ReturnableOrder, now: Date): boolean {
  return (
    order.status === "delivered" &&
    returnWindowOpen(latestDeliveredAt(order.history), now)
  );
}

export type ReturnInputErrors = { reason?: string; images?: string };

// Shared shape validation for the request payload — the route parses
// loosely typed JSON, the service applies the rules.
export function validateReturnInput(input: {
  reason: unknown;
  images: unknown;
}): ReturnInputErrors | null {
  const errors: ReturnInputErrors = {};
  const reason = typeof input.reason === "string" ? input.reason.trim() : "";
  if (!reason) {
    errors.reason = "Nhập lý do đổi trả / hoàn tiền.";
  } else if (reason.length > RETURN_REASON_MAX) {
    errors.reason = `Lý do tối đa ${RETURN_REASON_MAX} ký tự.`;
  }
  const images = Array.isArray(input.images)
    ? input.images.filter((u): u is string => typeof u === "string")
    : [];
  if (images.length === 0) {
    errors.images = "Đính kèm ít nhất 1 ảnh hiện trạng sản phẩm.";
  } else if (images.length > RETURN_IMAGE_MAX) {
    errors.images = `Tối đa ${RETURN_IMAGE_MAX} ảnh.`;
  } else if (images.some((url) => !isReturnImageUrl(url))) {
    errors.images = "Ảnh không hợp lệ — tải ảnh lên lại.";
  }
  return Object.keys(errors).length > 0 ? errors : null;
}
