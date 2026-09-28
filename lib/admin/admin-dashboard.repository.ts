// Raw CQL for the admin dashboard counters. Per-partition COUNT is cheap
// in Scylla and keeps the dashboard from hydrating ref rows it never shows.
import { scylla } from "@/lib/db/client";

export async function countRescueRefsByStatus(status: string): Promise<number> {
  const result = await scylla.execute(
    "SELECT COUNT(*) AS total FROM emergency_by_status WHERE status = ?",
    [status],
    { prepare: true },
  );
  const value = result.first()?.total;
  return typeof value === "number"
    ? value
    : Number.parseInt(String(value ?? 0), 10) || 0;
}
