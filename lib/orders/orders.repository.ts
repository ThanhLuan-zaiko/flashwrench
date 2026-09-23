import { scylla } from "@/lib/db/client";
import type {
  AddressSnapshot,
  OrderHistoryRow,
  OrderItemRow,
  OrderRow,
} from "./orders.types";

export const ORDER_COLUMNS =
  "order_id, customer_id, customer_name, customer_phone, shipping_address, status, payment_status, payment_method, fulfillment_type, courier_type, courier_id, courier_name, tracking_code, subtotal, shipping_fee, discount, total, coupon_code, note, month_bucket, created_at, updated_at";

function toAddressSnapshot(raw: unknown): AddressSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  return {
    province: (r.province as string | null) ?? "",
    district: (r.district as string | null) ?? "",
    ward: (r.ward as string | null) ?? "",
    street: (r.street as string | null) ?? "",
    fullText: (r.full_text as string | null) ?? "",
    lat: (r.lat as number | null) ?? null,
    lng: (r.lng as number | null) ?? null,
  };
}

export function toOrderRow(row: Record<string, unknown>): OrderRow {
  return {
    order_id: String(row.order_id),
    customer_id: row.customer_id ? String(row.customer_id) : null,
    customer_name: (row.customer_name as string | null) ?? null,
    customer_phone: (row.customer_phone as string | null) ?? null,
    shipping_address: toAddressSnapshot(row.shipping_address),
    status: (row.status as string | null) ?? null,
    payment_status: (row.payment_status as string | null) ?? null,
    payment_method: (row.payment_method as string | null) ?? null,
    fulfillment_type: (row.fulfillment_type as string | null) ?? null,
    courier_type: (row.courier_type as string | null) ?? null,
    courier_id: row.courier_id ? String(row.courier_id) : null,
    courier_name: (row.courier_name as string | null) ?? null,
    tracking_code: (row.tracking_code as string | null) ?? null,
    subtotal: (row.subtotal as number | null) ?? null,
    shipping_fee: (row.shipping_fee as number | null) ?? null,
    discount: (row.discount as number | null) ?? null,
    total: (row.total as number | null) ?? null,
    coupon_code: (row.coupon_code as string | null) ?? null,
    note: (row.note as string | null) ?? null,
    month_bucket: (row.month_bucket as string | null) ?? null,
    created_at: (row.created_at as Date | null) ?? null,
    updated_at: (row.updated_at as Date | null) ?? null,
  };
}

function toOrderItemRow(row: Record<string, unknown>): OrderItemRow {
  return {
    order_id: String(row.order_id),
    part_id: String(row.part_id),
    part_name: (row.part_name as string | null) ?? null,
    part_image: (row.part_image as string | null) ?? null,
    sku: (row.sku as string | null) ?? null,
    quantity: (row.quantity as number | null) ?? null,
    unit_price: (row.unit_price as number | null) ?? null,
    line_total: (row.line_total as number | null) ?? null,
  };
}

function toHistoryRow(row: Record<string, unknown>): OrderHistoryRow {
  return {
    order_id: String(row.order_id),
    changed_at: (row.changed_at as Date | null) ?? null,
    old_status: (row.old_status as string | null) ?? null,
    new_status: (row.new_status as string | null) ?? null,
    changed_by: row.changed_by ? String(row.changed_by) : null,
    note: (row.note as string | null) ?? null,
  };
}

export async function findOrderRowById(
  orderId: string,
): Promise<OrderRow | null> {
  const result = await scylla.execute(
    `SELECT ${ORDER_COLUMNS} FROM orders_by_id WHERE order_id = ?`,
    [orderId],
    { prepare: true },
  );
  const row = result.first() as unknown as Record<string, unknown> | null;
  return row ? toOrderRow(row) : null;
}

async function findOrderRowsByIds(ids: string[]): Promise<OrderRow[]> {
  const rows = await Promise.all(
    ids.map(async (id) => {
      const found = await scylla.execute(
        `SELECT ${ORDER_COLUMNS} FROM orders_by_id WHERE order_id = ?`,
        [id],
        { prepare: true },
      );
      const row = found.first() as unknown as Record<string, unknown> | null;
      return row ? toOrderRow(row) : null;
    }),
  );
  return rows.filter((r): r is OrderRow => r !== null);
}

export async function listOrderRowsByCustomer(
  customerId: string,
  limit = 50,
): Promise<OrderRow[]> {
  const result = await scylla.execute(
    "SELECT order_id FROM orders_by_customer WHERE customer_id = ? LIMIT ?",
    [customerId, limit],
    { prepare: true },
  );
  const ids = result.rows.map((r) =>
    String((r as unknown as { order_id: unknown }).order_id),
  );
  return findOrderRowsByIds(ids);
}

export type OrderStatusPage = {
  rows: OrderRow[];
  pageState: string | null;
};

// Staff list: page the status partition, then fan out to orders_by_id for
// the full rows (the status table only stores id/customer/total refs).
export async function listOrderRowsByStatus(
  status: string,
  monthBucket: string,
  limit: number,
  pageState: string | null,
): Promise<OrderStatusPage> {
  const result = await scylla.execute(
    "SELECT order_id FROM orders_by_status WHERE status = ? AND month_bucket = ?",
    [status, monthBucket],
    {
      prepare: true,
      fetchSize: limit,
      pageState: pageState ?? undefined,
    },
  );
  const ids = result.rows.map((r) =>
    String((r as unknown as { order_id: unknown }).order_id),
  );
  return {
    rows: await findOrderRowsByIds(ids),
    pageState: result.pageState ?? null,
  };
}

// Mechanic courier board: deliveries assigned to one mechanic, newest
// first, then fan out to orders_by_id for address coordinates.
export async function listOrderRowsByCourier(
  courierId: string,
  limit = 50,
): Promise<OrderRow[]> {
  const result = await scylla.execute(
    "SELECT order_id FROM orders_by_courier WHERE courier_id = ? LIMIT ?",
    [courierId, limit],
    { prepare: true },
  );
  const ids = result.rows.map((r) =>
    String((r as unknown as { order_id: unknown }).order_id),
  );
  return findOrderRowsByIds(ids);
}

export async function listOrderItemRows(
  orderId: string,
): Promise<OrderItemRow[]> {
  const result = await scylla.execute(
    "SELECT order_id, part_id, part_name, part_image, sku, quantity, unit_price, line_total FROM order_items_by_order WHERE order_id = ?",
    [orderId],
    { prepare: true },
  );
  return result.rows.map((r) =>
    toOrderItemRow(r as unknown as Record<string, unknown>),
  );
}

export async function listOrderHistoryRows(
  orderId: string,
): Promise<OrderHistoryRow[]> {
  const result = await scylla.execute(
    "SELECT order_id, changed_at, old_status, new_status, changed_by, note FROM order_status_history WHERE order_id = ?",
    [orderId],
    { prepare: true },
  );
  return result.rows.map((r) =>
    toHistoryRow(r as unknown as Record<string, unknown>),
  );
}
