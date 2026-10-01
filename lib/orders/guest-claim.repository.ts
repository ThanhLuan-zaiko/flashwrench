// Raw CQL for absorbing guest orders into a fresh account — same
// contact-pair match as the booking claim, different tables.
import { scylla } from "@/lib/db/client";

export type GuestOrderRefRow = {
  order_id: string;
  email: string | null;
};

export async function listGuestOrderRefsByPhone(
  phone: string,
): Promise<GuestOrderRefRow[]> {
  const result = await scylla.execute(
    "SELECT order_id, email FROM guest_orders_by_phone WHERE phone = ?",
    [phone],
    { prepare: true },
  );
  return (result.rows as unknown as Record<string, unknown>[]).map((row) => ({
    order_id: String(row.order_id),
    email: (row.email as string | null) ?? null,
  }));
}

export type ClaimGuestOrderWrite = {
  orderId: string;
  customerId: string;
  createdAt: Date | null;
  status: string | null;
  total: number | null;
  monthBucket: string | null;
  at: Date;
};

// One batch: owner on the order row, the customer history partition
// (clustered by created_at), and the admin status bucket whose row keeps
// customer_id as a plain column.
export async function claimGuestOrder(
  write: ClaimGuestOrderWrite,
): Promise<void> {
  const queries: { query: string; params: unknown[] }[] = [
    {
      query:
        "UPDATE orders_by_id SET customer_id = ?, updated_at = ? WHERE order_id = ?",
      params: [write.customerId, write.at, write.orderId],
    },
  ];

  if (write.createdAt) {
    queries.push({
      query:
        "INSERT INTO orders_by_customer (customer_id, created_at, order_id, status, total) VALUES (?, ?, ?, ?, ?)",
      params: [
        write.customerId,
        write.createdAt,
        write.orderId,
        write.status,
        write.total,
      ],
    });
  }

  if (write.status && write.monthBucket && write.createdAt) {
    queries.push({
      query:
        "UPDATE orders_by_status SET customer_id = ? WHERE status = ? AND month_bucket = ? AND created_at = ? AND order_id = ?",
      params: [
        write.customerId,
        write.status,
        write.monthBucket,
        write.createdAt,
        write.orderId,
      ],
    });
  }

  await scylla.batch(queries, { prepare: true });
}

export async function deleteGuestOrderRef(
  phone: string,
  orderId: string,
): Promise<void> {
  await scylla.execute(
    "DELETE FROM guest_orders_by_phone WHERE phone = ? AND order_id = ?",
    [phone, orderId],
    { prepare: true },
  );
}
