import type {
  CheckoutInput,
  OrderDetail,
  OrderSummary,
  OrderTrackView,
} from "@/lib/orders/orders.types";
import { apiRequest } from "./auth.api";

export function fetchMyOrders(): Promise<{ orders: OrderSummary[] }> {
  return apiRequest<{ orders: OrderSummary[] }>("/api/orders");
}

export function fetchMyOrder(orderId: string): Promise<{ order: OrderDetail }> {
  return apiRequest<{ order: OrderDetail }>(
    `/api/orders/${encodeURIComponent(orderId)}`,
  );
}

export function fetchMyOrderTrack(
  orderId: string,
): Promise<{ track: OrderTrackView }> {
  return apiRequest<{ track: OrderTrackView }>(
    `/api/orders/${encodeURIComponent(orderId)}/track`,
  );
}

export function checkoutRequest(
  payload: CheckoutInput,
): Promise<{ order: OrderDetail }> {
  return apiRequest<{ order: OrderDetail }>("/api/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function cancelOrderRequest(
  orderId: string,
): Promise<{ order: OrderDetail }> {
  return apiRequest<{ order: OrderDetail }>(
    `/api/orders/${encodeURIComponent(orderId)}`,
    { method: "PATCH", body: JSON.stringify({ action: "cancel" }) },
  );
}

// Return/refund request on a delivered order: reason + evidence photo
// URLs (uploaded to /api/media first). Server enforces the 3-day window.
export function requestOrderReturnRequest(
  orderId: string,
  input: { reason: string; images: string[] },
): Promise<{ order: OrderDetail }> {
  return apiRequest<{ order: OrderDetail }>(
    `/api/orders/${encodeURIComponent(orderId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ action: "request-return", ...input }),
    },
  );
}

export type OrderPaymentResult = {
  order: OrderDetail;
  payment: { providerRef: string | null; paidAt: string | null };
};

// Mock gateway settlement: POST { action: "pay" } marks the order paid
// with a simulated MOCK-* provider reference.
export function payOrderOnlineRequest(
  orderId: string,
): Promise<OrderPaymentResult> {
  return apiRequest<OrderPaymentResult>(
    `/api/orders/${encodeURIComponent(orderId)}/payment`,
    { method: "POST", body: JSON.stringify({ action: "pay" }) },
  );
}
