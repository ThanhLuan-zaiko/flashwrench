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
