import { scylla } from "@/lib/db/client";
import type { CartRow } from "./orders.types";

function toCartRow(row: Record<string, unknown>): CartRow {
  return {
    customer_id: String(row.customer_id),
    part_id: String(row.part_id),
    qty: (row.qty as number | null) ?? null,
    unit_price: (row.unit_price as number | null) ?? null,
    part_name: (row.part_name as string | null) ?? null,
    part_image: (row.part_image as string | null) ?? null,
    added_at: (row.added_at as Date | null) ?? null,
  };
}

export async function listCartRows(customerId: string): Promise<CartRow[]> {
  const result = await scylla.execute(
    "SELECT customer_id, part_id, qty, unit_price, part_name, part_image, added_at FROM carts_by_customer WHERE customer_id = ?",
    [customerId],
    { prepare: true },
  );
  return result.rows.map((r) =>
    toCartRow(r as unknown as Record<string, unknown>),
  );
}

// Upsert with a fresh snapshot of name/image/price: the cart row always
// shows the latest known display data. added_at refreshes on each write
// so the newest touch sorts the row.
export async function upsertCartItem(params: {
  customerId: string;
  partId: string;
  qty: number;
  unitPrice: number;
  partName: string;
  partImage: string;
  now: Date;
}): Promise<void> {
  await scylla.execute(
    "INSERT INTO carts_by_customer (customer_id, part_id, qty, unit_price, part_name, part_image, added_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      params.customerId,
      params.partId,
      params.qty,
      params.unitPrice,
      params.partName,
      params.partImage,
      params.now,
    ],
    { prepare: true },
  );
}

export async function deleteCartItem(
  customerId: string,
  partId: string,
): Promise<void> {
  await scylla.execute(
    "DELETE FROM carts_by_customer WHERE customer_id = ? AND part_id = ?",
    [customerId, partId],
    { prepare: true },
  );
}

export async function clearCartRows(customerId: string): Promise<void> {
  await scylla.execute(
    "DELETE FROM carts_by_customer WHERE customer_id = ?",
    [customerId],
    { prepare: true },
  );
}
