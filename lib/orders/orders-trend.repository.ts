// Raw CQL for the parts-order trend chart: the status table already
// carries created_at and total, so the trend never hydrates full orders.
import { scylla } from "@/lib/db/client";

export type OrderTrendRow = {
  created_at: Date | null;
  total: number | null;
};

export type OrderTrendPage = {
  rows: OrderTrendRow[];
  pageState: string | null;
};

function toTotal(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(String(value));
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export async function listOrderTrendRows(
  status: string,
  monthBucket: string,
  limit: number,
): Promise<OrderTrendPage> {
  const result = await scylla.execute(
    "SELECT created_at, total FROM orders_by_status WHERE status = ? AND month_bucket = ?",
    [status, monthBucket],
    { prepare: true, fetchSize: limit },
  );
  return {
    rows: result.rows.map((raw) => {
      const row = raw as unknown as Record<string, unknown>;
      const value = row.created_at;
      const date =
        value instanceof Date ? value : value ? new Date(String(value)) : null;
      return {
        created_at: date && Number.isFinite(date.getTime()) ? date : null,
        total: toTotal(row.total),
      };
    }),
    pageState: result.pageState ?? null,
  };
}
