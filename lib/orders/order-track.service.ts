import { isValidLatitude, isValidLongitude } from "@/lib/mechanic/mechanic-geo";
import { findMechanicLocationRow } from "@/lib/mechanic/mechanic-workspace.repository";
import { isUuid } from "@/lib/validation";
import { findOrderRowById } from "./orders.repository";
import type {
  OrdersResult,
  OrderTrackView,
  PublicOrderTracking,
} from "./orders.types";
import { listOrderTravelPointRows } from "./orders-delivery.repository";

function fail<T>(status: number, form: string): OrdersResult<T> {
  return { ok: false, status, errors: { form } };
}

// Customer-facing delivery tracking: destination pin from the checkout
// map pick, courier breadcrumbs, and the courier's live position while
// a mechanic is shipping the order.
export async function getMyOrderTrack(
  customerId: string,
  orderId: string,
): Promise<OrdersResult<OrderTrackView>> {
  if (!isUuid(orderId)) return fail(400, "Mã đơn hàng không hợp lệ.");
  const row = await findOrderRowById(orderId);
  if (!row || row.customer_id !== customerId) {
    return fail(404, "Không tìm thấy đơn hàng.");
  }
  const address = row.shipping_address;
  const destination =
    address && isValidLatitude(address.lat) && isValidLongitude(address.lng)
      ? { lat: address.lat, lng: address.lng }
      : null;
  const points = (await listOrderTravelPointRows(orderId))
    .filter(
      (point) =>
        point.recorded_at !== null &&
        isValidLatitude(point.lat) &&
        isValidLongitude(point.lng),
    )
    .map((point) => ({
      lat: point.lat as number,
      lng: point.lng as number,
      recordedAt: point.recorded_at?.toISOString() ?? null,
    }));
  let courier: OrderTrackView["courier"] = null;
  if (row.courier_type === "mechanic" && row.courier_id) {
    const location = await findMechanicLocationRow(row.courier_id);
    if (
      location &&
      isValidLatitude(location.lat) &&
      isValidLongitude(location.lng)
    ) {
      courier = {
        lat: location.lat,
        lng: location.lng,
        updatedAt: location.updated_at?.toISOString() ?? null,
      };
    }
  }
  return { ok: true, data: { destination, courier, points } };
}

// Guest tracking link: anyone holding the unguessable order id can
// follow status, the courier name and the live pin while the order is
// out for delivery. No customer identity fields — same contract as the
// public rescue tracking endpoint.
export async function getPublicOrderTracking(
  orderId: string,
): Promise<OrdersResult<PublicOrderTracking>> {
  if (!isUuid(orderId)) return fail(400, "Mã đơn hàng không hợp lệ.");
  const row = await findOrderRowById(orderId);
  if (!row) return fail(404, "Không tìm thấy đơn hàng.");

  const address = row.shipping_address;
  const destination =
    address && isValidLatitude(address.lat) && isValidLongitude(address.lng)
      ? { lat: address.lat, lng: address.lng }
      : null;

  let courier: PublicOrderTracking["courier"] = null;
  if (
    row.status === "shipping" &&
    row.courier_type === "mechanic" &&
    row.courier_id
  ) {
    const location = await findMechanicLocationRow(row.courier_id);
    if (
      location &&
      isValidLatitude(location.lat) &&
      isValidLongitude(location.lng)
    ) {
      courier = {
        lat: location.lat,
        lng: location.lng,
        updatedAt: location.updated_at?.toISOString() ?? null,
      };
    }
  }

  return {
    ok: true,
    data: {
      orderId: row.order_id,
      status: row.status ?? "pending",
      paymentStatus: row.payment_status,
      fulfillmentType: row.fulfillment_type,
      courierName: row.courier_name,
      trackingCode: row.tracking_code,
      destination,
      courier,
      updatedAt: row.updated_at?.toISOString() ?? null,
    },
  };
}
