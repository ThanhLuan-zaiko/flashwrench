import { matchesSearch } from "@/lib/search-text";
import type { OrderSummary } from "./orders.types";

// Dispatcher order search: order id, customer, tracking code and courier.
export type OrderSearchable = Pick<
  OrderSummary,
  "id" | "customerName" | "customerPhone" | "trackingCode" | "courierName"
>;

export function matchesOrderSearch(
  order: OrderSearchable,
  query: string,
): boolean {
  return matchesSearch(query, [
    order.id,
    order.customerName,
    order.customerPhone,
    order.trackingCode,
    order.courierName,
  ]);
}
