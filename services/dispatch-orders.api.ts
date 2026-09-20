import type { OrderDetail, OrderSummary } from "@/lib/orders/orders.types";
import type { PartItem } from "@/lib/parts/parts.types";
import { apiRequest } from "./auth.api";

export type { OrderDetail, OrderSummary, PartItem };

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

export function updateDispatchOrderStatus(
  orderId: string,
  status: string,
  note?: string,
): Promise<{ order: OrderDetail }> {
  return apiRequest<{ order: OrderDetail }>(
    `/api/dispatch/orders/${encodeURIComponent(orderId)}`,
    { method: "PATCH", body: JSON.stringify({ status, note }) },
  );
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
