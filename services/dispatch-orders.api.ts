import type {
  CourierConfigInput,
  OrderDetail,
  OrderSummary,
} from "@/lib/orders/orders.types";
import type { PartItem } from "@/lib/parts/parts.types";
import type { OrderInvoice } from "@/lib/payments/order-payment.types";
import { apiRequest } from "./auth.api";
import type { OrderPaymentResult } from "./orders.api";

export type {
  CourierConfigInput,
  OrderDetail,
  OrderInvoice,
  OrderSummary,
  PartItem,
};

export type CounterSalePayload = {
  customerName?: string;
  customerPhone?: string;
  note?: string;
  lines: { partId: string; quantity: number }[];
};

export type DispatchOrdersQuery = {
  status: string;
  month?: string;
  cursor?: string | null;
  limit?: number;
};

function toOrdersQueryString(query: DispatchOrdersQuery): string {
  const params = new URLSearchParams();
  params.set("status", query.status);
  if (query.month) params.set("month", query.month);
  if (query.cursor) params.set("cursor", query.cursor);
  if (query.limit) params.set("limit", String(query.limit));
  const text = params.toString();
  return text ? `?${text}` : "";
}

// Dispatch board: one status partition of one month bucket. `cursor` is
// the signed pageState returned as `nextCursor`.
export function fetchDispatchOrders(
  query: DispatchOrdersQuery,
): Promise<{ items: OrderSummary[]; nextCursor: string | null }> {
  return apiRequest<{ items: OrderSummary[]; nextCursor: string | null }>(
    `/api/dispatch/orders${toOrdersQueryString(query)}`,
  );
}

export function fetchDispatchOrder(
  orderId: string,
): Promise<{ order: OrderDetail }> {
  return apiRequest<{ order: OrderDetail }>(
    `/api/dispatch/orders/${encodeURIComponent(orderId)}`,
  );
}

// Invoice view: order detail plus the latest payment receipt row.
export function fetchDispatchOrderInvoice(
  orderId: string,
): Promise<{ invoice: OrderInvoice }> {
  return apiRequest<{ invoice: OrderInvoice }>(
    `/api/dispatch/orders/${encodeURIComponent(orderId)}/invoice`,
  );
}

export function updateDispatchOrderStatus(
  orderId: string,
  status: string,
  note?: string,
  courier?: CourierConfigInput,
): Promise<{ order: OrderDetail }> {
  return apiRequest<{ order: OrderDetail }>(
    `/api/dispatch/orders/${encodeURIComponent(orderId)}`,
    { method: "PATCH", body: JSON.stringify({ status, note, courier }) },
  );
}

// Staff collects a "Thanh toán tại quầy" order at the till while the
// customer is present — settles payment without touching the status.
export function collectDispatchOrderPayment(
  orderId: string,
): Promise<OrderPaymentResult> {
  return apiRequest<OrderPaymentResult>(
    `/api/dispatch/orders/${encodeURIComponent(orderId)}`,
    { method: "PATCH", body: JSON.stringify({ action: "collect-payment" }) },
  );
}

export function createCounterSaleRequest(
  payload: CounterSalePayload,
): Promise<{ order: OrderDetail }> {
  return apiRequest<{ order: OrderDetail }>("/api/dispatch/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchDispatchParts(): Promise<{ parts: PartItem[] }> {
  return apiRequest<{ parts: PartItem[] }>("/api/dispatch/parts");
}

export function setPartStockRequest(
  partId: string,
  stockQty: number,
): Promise<{ part: PartItem }> {
  return apiRequest<{ part: PartItem }>(
    `/api/dispatch/parts/${encodeURIComponent(partId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ action: "set-stock", stockQty }),
    },
  );
}
