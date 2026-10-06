// Tracking-related order shapes, split from orders.types.ts to keep that
// file under the line limit. Everything here is re-exported from
// orders.types so existing imports keep working.

// GPS breadcrumb written by the courier while an order is shipping.
export type OrderTravelPointRow = {
  order_id: string;
  recorded_at: Date | null;
  courier_id: string | null;
  lat: number | null;
  lng: number | null;
};

export type OrderTravelPoint = {
  lat: number;
  lng: number;
  recordedAt: string | null;
};

// Customer-facing delivery tracking payload.
export type OrderTrackView = {
  destination: { lat: number; lng: number } | null;
  courier: { lat: number; lng: number; updatedAt: string | null } | null;
  points: OrderTravelPoint[];
};

// Public guest-tracking payload: the unguessable order id is the
// capability, so the shape carries fulfilment progress only — status,
// courier identity + live position while shipping, the drop pin the
// guest pinned themselves. Never customer PII beyond what they typed.
export type PublicOrderTracking = {
  orderId: string;
  status: string;
  paymentStatus: string | null;
  fulfillmentType: string | null;
  courierName: string | null;
  trackingCode: string | null;
  destination: { lat: number; lng: number } | null;
  courier: { lat: number; lng: number; updatedAt: string | null } | null;
  // Courier-COD confirm code, present only while cash is still owed — the
  // tracking link is the capability, same rule as public booking tracking.
  paymentConfirmCode: string | null;
  updatedAt: string | null;
};
