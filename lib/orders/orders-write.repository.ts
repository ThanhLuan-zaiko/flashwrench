import { scylla } from "@/lib/db/client";
import type { AddressSnapshot } from "./orders.types";

export type NewOrderLine = {
  partId: string;
  partName: string;
  partImage: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type InsertOrderParams = {
  orderId: string;
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  address: AddressSnapshot | null;
  status: string;
  paymentStatus: string;
  paidAt: Date | null;
  fulfillmentType: string;
  historyNote: string;
  createdBy: string | null;
  subtotal: number;
  shippingFee: number;
  total: number;
  note: string;
  monthBucket: string;
  lines: NewOrderLine[];
  paymentId: string;
  now: Date;
};

// One logged batch writes the order row, the read models (by customer
// when the buyer has an account, by status), every order line, the
// first history entry and the COD payment rows so a sale is never
// half-visible. Walk-in counter sales have no customer account, so the
// customer-partitioned projections are skipped for them.
export async function insertOrder(params: InsertOrderParams): Promise<void> {
  const statements: { query: string; params: unknown[] }[] = [
    {
      query:
        "INSERT INTO orders_by_id (order_id, customer_id, customer_name, customer_phone, shipping_address, status, payment_status, payment_method, fulfillment_type, courier_type, courier_id, courier_name, tracking_code, subtotal, shipping_fee, discount, total, coupon_code, note, month_bucket, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'cod', ?, null, null, null, null, ?, ?, 0, ?, null, ?, ?, ?, ?)",
      params: [
        params.orderId,
        params.customerId,
        params.customerName,
        params.customerPhone,
        params.address,
        params.status,
        params.paymentStatus,
        params.fulfillmentType,
        params.subtotal,
        params.shippingFee,
        params.total,
        params.note,
        params.monthBucket,
        params.now,
        params.now,
      ],
    },
    {
      query:
        "INSERT INTO orders_by_status (status, month_bucket, created_at, order_id, customer_id, total) VALUES (?, ?, ?, ?, ?, ?)",
      params: [
        params.status,
        params.monthBucket,
        params.now,
        params.orderId,
        params.customerId,
        params.total,
      ],
    },
    {
      query:
        "INSERT INTO order_status_history (order_id, changed_at, old_status, new_status, changed_by, note) VALUES (?, ?, null, ?, ?, ?)",
      params: [
        params.orderId,
        params.now,
        params.status,
        params.createdBy,
        params.historyNote,
      ],
    },
    {
      query:
        "INSERT INTO payments_by_id (payment_id, ref_type, ref_id, customer_id, amount, method, status, provider_ref, paid_at, created_at) VALUES (?, 'order', ?, ?, ?, 'cod', ?, null, ?, ?)",
      params: [
        params.paymentId,
        params.orderId,
        params.customerId,
        params.total,
        params.paymentStatus,
        params.paidAt,
        params.now,
      ],
    },
    {
      query:
        "INSERT INTO payments_by_ref (ref_type, ref_id, created_at, payment_id, amount, status) VALUES ('order', ?, ?, ?, ?, ?)",
      params: [
        params.orderId,
        params.now,
        params.paymentId,
        params.total,
        params.paymentStatus,
      ],
    },
  ];
  if (params.customerId) {
    statements.push(
      {
        query:
          "INSERT INTO orders_by_customer (customer_id, created_at, order_id, status, total) VALUES (?, ?, ?, ?, ?)",
        params: [
          params.customerId,
          params.now,
          params.orderId,
          params.status,
          params.total,
        ],
      },
      {
        query:
          "INSERT INTO payments_by_customer (customer_id, created_at, payment_id, ref_type, ref_id, amount, status) VALUES (?, ?, ?, 'order', ?, ?, ?)",
        params: [
          params.customerId,
          params.now,
          params.paymentId,
          params.orderId,
          params.total,
          params.paymentStatus,
        ],
      },
    );
  }
  for (const line of params.lines) {
    statements.push({
      query:
        "INSERT INTO order_items_by_order (order_id, part_id, part_name, part_image, sku, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      params: [
        params.orderId,
        line.partId,
        line.partName,
        line.partImage,
        line.sku,
        line.quantity,
        line.unitPrice,
        line.lineTotal,
      ],
    });
  }
  await scylla.batch(statements, { prepare: true });
}

// Status moves across partitions: delete the old (status, month) row and
// insert the new one; the by-id and by-customer copies update in place.
// Walk-in sales have no customer account, so their by-customer row is
// absent and the update is skipped.
export async function updateOrderStatusRows(params: {
  orderId: string;
  customerId: string | null;
  oldStatus: string;
  newStatus: string;
  monthBucket: string;
  createdAt: Date;
  total: number;
  now: Date;
}): Promise<void> {
  const statements: { query: string; params: unknown[] }[] = [
    {
      query:
        "UPDATE orders_by_id SET status = ?, updated_at = ? WHERE order_id = ?",
      params: [params.newStatus, params.now, params.orderId],
    },
    {
      query:
        "DELETE FROM orders_by_status WHERE status = ? AND month_bucket = ? AND created_at = ? AND order_id = ?",
      params: [
        params.oldStatus,
        params.monthBucket,
        params.createdAt,
        params.orderId,
      ],
    },
    {
      query:
        "INSERT INTO orders_by_status (status, month_bucket, created_at, order_id, customer_id, total) VALUES (?, ?, ?, ?, ?, ?)",
      params: [
        params.newStatus,
        params.monthBucket,
        params.createdAt,
        params.orderId,
        params.customerId,
        params.total,
      ],
    },
  ];
  if (params.customerId) {
    statements.push({
      query:
        "UPDATE orders_by_customer SET status = ? WHERE customer_id = ? AND created_at = ? AND order_id = ?",
      params: [
        params.newStatus,
        params.customerId,
        params.createdAt,
        params.orderId,
      ],
    });
  }
  await scylla.batch(statements, { prepare: true });
}

export async function insertOrderHistory(params: {
  orderId: string;
  oldStatus: string | null;
  newStatus: string;
  changedBy: string;
  note: string;
  now: Date;
}): Promise<void> {
  await scylla.execute(
    "INSERT INTO order_status_history (order_id, changed_at, old_status, new_status, changed_by, note) VALUES (?, ?, ?, ?, ?, ?)",
    [
      params.orderId,
      params.now,
      params.oldStatus,
      params.newStatus,
      params.changedBy,
      params.note,
    ],
    { prepare: true },
  );
}
