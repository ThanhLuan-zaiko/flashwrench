import type { FulfillmentType, OrderDetail } from "@/lib/orders/orders.types";

// How a parts order is paid: cash on handover (cod), at the workshop
// counter, or through the simulated online gateway (bank_transfer with a
// MOCK-* provider ref — no real money moves).
export type OrderPaymentMethod = "cod" | "counter" | "bank_transfer";

export const ORDER_PAYMENT_METHODS: OrderPaymentMethod[] = [
  "cod",
  "counter",
  "bank_transfer",
];

export function isOrderPaymentMethod(
  value: unknown,
): value is OrderPaymentMethod {
  return (
    typeof value === "string" &&
    (ORDER_PAYMENT_METHODS as string[]).includes(value)
  );
}

// Methods offered at checkout. Pickup orders skip cod — paying the courier
// only makes sense when a courier exists.
export function paymentMethodsFor(
  fulfillment: FulfillmentType,
): OrderPaymentMethod[] {
  return fulfillment === "pickup"
    ? ["counter", "bank_transfer"]
    : ["cod", "counter", "bank_transfer"];
}

export function defaultPaymentMethodFor(
  fulfillment: FulfillmentType,
): OrderPaymentMethod {
  return fulfillment === "pickup" ? "counter" : "cod";
}

// Checkout may omit the method (older clients); resolve to the default, or
// null when the caller asked for a method that does not fit the order.
export function resolveOrderPaymentMethod(
  fulfillment: FulfillmentType,
  raw: string | undefined,
): OrderPaymentMethod | null {
  const value = raw?.trim();
  if (!value) return defaultPaymentMethodFor(fulfillment);
  if (!isOrderPaymentMethod(value)) return null;
  return paymentMethodsFor(fulfillment).includes(value) ? value : null;
}

// The staff invoice pairs the order detail with the latest payment row so
// the receipt can show method, amount, the MOCK-*/gateway reference and
// when money actually changed hands.
export type OrderPaymentReceipt = {
  paymentId: string;
  method: string | null;
  status: string | null;
  amount: number | null;
  providerRef: string | null;
  paidAt: string | null;
  createdAt: string | null;
};

export type OrderInvoice = {
  order: OrderDetail;
  payment: OrderPaymentReceipt | null;
};
