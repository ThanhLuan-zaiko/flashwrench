// Raw CQL for the zone-load chart: per-partition COUNT on the zone/status
// rescue table is cheap and never hydrates rescue rows.
import { scylla } from "@/lib/db/client";

export async function countZoneRescues(
  zoneId: string,
  status: string,
): Promise<number> {
  const result = await scylla.execute(
    "SELECT COUNT(*) AS total FROM emergency_by_zone_status WHERE zone_id = ? AND status = ?",
    [zoneId, status],
    { prepare: true },
  );
  const value = result.first()?.total;
  return typeof value === "number"
    ? value
    : Number.parseInt(String(value ?? 0), 10) || 0;
}
