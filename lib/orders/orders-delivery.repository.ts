import { scylla } from "@/lib/db/client";
import type { OrderTravelPointRow } from "./orders.types";

// Courier assignment stamped on the order when it ships: the by-id row
// carries the carrier display fields, and mechanic couriers get a
// by-courier projection row that feeds their navigation board.
export async function assignOrderCourier(params: {
  orderId: string;
  courierType: string;
  courierId: string | null;
  courierName: string | null;
  trackingCode: string | null;
  orderCreatedAt: Date;
  orderTotal: number;
  customerName: string;
  now: Date;
}): Promise<void> {
  const statements: { query: string; params: unknown[] }[] = [
    {
      query:
        "UPDATE orders_by_id SET courier_type = ?, courier_id = ?, courier_name = ?, tracking_code = ?, updated_at = ? WHERE order_id = ?",
      params: [
        params.courierType,
        params.courierId,
        params.courierName,
        params.trackingCode,
        params.now,
        params.orderId,
      ],
    },
  ];
  if (params.courierId) {
    statements.push({
      query:
        "INSERT INTO orders_by_courier (courier_id, created_at, order_id, status, total, customer_name) VALUES (?, ?, ?, 'shipping', ?, ?)",
      params: [
        params.courierId,
        params.orderCreatedAt,
        params.orderId,
        params.orderTotal,
        params.customerName,
      ],
    });
  }
  await scylla.batch(statements, { prepare: true });
}

// Keep the courier's board row in sync when the delivery finishes or
// falls back (delivered / cancelled).
export async function updateOrderCourierStatus(params: {
  courierId: string;
  orderCreatedAt: Date;
  orderId: string;
  status: string;
}): Promise<void> {
  await scylla.execute(
    "UPDATE orders_by_courier SET status = ? WHERE courier_id = ? AND created_at = ? AND order_id = ?",
    [params.status, params.courierId, params.orderCreatedAt, params.orderId],
    { prepare: true },
  );
}

// COD settlement: delivery is the collection point, so delivered marks
// the order and its payment rows paid; a refund flips them to refunded.
export async function markOrderPaymentStatus(params: {
  orderId: string;
  customerId: string | null;
  paymentStatus: string;
  paidAt: Date | null;
  now: Date;
  paymentRefs: { paymentId: string; createdAt: Date }[];
}): Promise<void> {
  const statements: { query: string; params: unknown[] }[] = [
    {
      query:
        "UPDATE orders_by_id SET payment_status = ?, updated_at = ? WHERE order_id = ?",
      params: [params.paymentStatus, params.now, params.orderId],
    },
  ];
  for (const ref of params.paymentRefs) {
    statements.push(
      {
        query:
          "UPDATE payments_by_id SET status = ?, paid_at = ? WHERE payment_id = ?",
        params: [params.paymentStatus, params.paidAt, ref.paymentId],
      },
      {
        query:
          "UPDATE payments_by_ref SET status = ? WHERE ref_type = 'order' AND ref_id = ? AND created_at = ? AND payment_id = ?",
        params: [
          params.paymentStatus,
          params.orderId,
          ref.createdAt,
          ref.paymentId,
        ],
      },
    );
    if (params.customerId) {
      statements.push({
        query:
          "UPDATE payments_by_customer SET status = ? WHERE customer_id = ? AND created_at = ? AND payment_id = ?",
        params: [
          params.paymentStatus,
          params.customerId,
          ref.createdAt,
          ref.paymentId,
        ],
      });
    }
  }
  await scylla.batch(statements, { prepare: true });
}

// Courier GPS breadcrumb while an order is shipping; the customer map
// reads this partition plus the courier's live mechanic_locations row.
export async function insertOrderTravelPoint(params: {
  orderId: string;
  courierId: string;
  lat: number;
  lng: number;
  recordedAt: Date;
}): Promise<void> {
  await scylla.execute(
    "INSERT INTO order_travel_points_by_order (order_id, recorded_at, courier_id, lat, lng) VALUES (?, ?, ?, ?, ?)",
    [
      params.orderId,
      params.recordedAt,
      params.courierId,
      params.lat,
      params.lng,
    ],
    { prepare: true },
  );
}

export async function listOrderTravelPointRows(
  orderId: string,
): Promise<OrderTravelPointRow[]> {
  const result = await scylla.execute(
    "SELECT order_id, recorded_at, courier_id, lat, lng FROM order_travel_points_by_order WHERE order_id = ?",
    [orderId],
    { prepare: true },
  );
  return result.rows.map((r) => {
    const row = r as unknown as Record<string, unknown>;
    return {
      order_id: String(row.order_id),
      recorded_at: (row.recorded_at as Date | null) ?? null,
      courier_id: row.courier_id ? String(row.courier_id) : null,
      lat: (row.lat as number | null) ?? null,
      lng: (row.lng as number | null) ?? null,
    };
  });
}

// Payment rows that belong to an order, keyed by their clustering
// columns so markOrderPaymentStatus can update each projection.
export async function listOrderPaymentRefs(
  orderId: string,
): Promise<{ paymentId: string; createdAt: Date }[]> {
  const result = await scylla.execute(
    "SELECT payment_id, created_at FROM payments_by_ref WHERE ref_type = 'order' AND ref_id = ?",
    [orderId],
    { prepare: true },
  );
  return (result.rows as unknown as Record<string, unknown>[])
    .map((row) => ({
      paymentId: row.payment_id ? String(row.payment_id) : null,
      createdAt: (row.created_at as Date | null) ?? null,
    }))
    .filter(
      (ref): ref is { paymentId: string; createdAt: Date } =>
        ref.paymentId !== null && ref.createdAt !== null,
    );
}
