// Pure builder for delivery-order navigation targets: shipping orders
// assigned to the mechanic become pins next to the booking targets on the
// navigation board. Orders without a pinned destination are skipped.
import type { OrderRow } from "@/lib/orders/orders.types";
import type { MechanicNavigationTarget } from "./mechanic.types";
import { toIso } from "./mechanic.types";
import {
  estimateEtaMin,
  haversineKm,
  isValidLatitude,
  isValidLongitude,
} from "./mechanic-geo";

export function orderNavigationTargets(
  orders: OrderRow[],
  origin: { lat: number; lng: number } | null,
): MechanicNavigationTarget[] {
  const targets: MechanicNavigationTarget[] = [];
  for (const order of orders) {
    if (order.status !== "shipping") continue;
    const lat = order.shipping_address?.lat ?? null;
    const lng = order.shipping_address?.lng ?? null;
    if (
      typeof lat !== "number" ||
      typeof lng !== "number" ||
      !isValidLatitude(lat) ||
      !isValidLongitude(lng)
    ) {
      continue;
    }
    const distanceKm = origin ? haversineKm(origin, { lat, lng }) : 0;
    targets.push({
      kind: "order",
      bookingId: order.order_id,
      customerName: order.customer_name ?? "",
      addressText:
        order.shipping_address?.fullText || "Chưa có địa chỉ chi tiết",
      lat,
      lng,
      status: "en_route",
      scheduledAt: toIso(order.created_at),
      timezone: null,
      distanceKm,
      etaMin: origin ? estimateEtaMin(distanceKm) : 0,
      serviceNames: ["Giao linh kiện"],
    });
  }
  return targets;
}
