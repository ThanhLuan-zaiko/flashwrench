import type { FulfillmentType } from "./orders.types";

// Flat COD shipping fee; delivery orders at/above the threshold ship
// free, pickup orders never pay shipping.
export const ORDER_SHIPPING_FEE = 30_000;
export const FREE_SHIPPING_THRESHOLD = 500_000;

export function orderShippingFee(
  fulfillment: FulfillmentType,
  subtotal: number,
): number {
  if (fulfillment === "pickup") return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : ORDER_SHIPPING_FEE;
}
