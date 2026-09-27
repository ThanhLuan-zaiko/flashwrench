// Shop-issued tracking code for third-party shipments when the dispatcher
// does not type the carrier's own code. Derived from the order id, so it
// stays stable across retries and is traceable back to the order.
export function generateTrackingCode(orderId: string): string {
  return `FW-${orderId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}
