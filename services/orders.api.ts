import type {
  CheckoutInput,
  OrderDetail,
  OrderSummary,
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
