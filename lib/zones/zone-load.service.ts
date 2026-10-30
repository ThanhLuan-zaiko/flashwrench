// Open rescues per service zone for the admin rescue screen chart:
// waiting (open + dispatched) and in progress (accepted → arrived).
import type { PublicUser } from "@/lib/auth/user.types";
import type { WorkspaceResult } from "@/lib/booking/workspace.types";
import { listServiceZones } from "./zone.repository";
import { countZoneRescues } from "./zone-load.repository";

const WAITING = ["open", "dispatched"] as const;
const ACTIVE = ["accepted", "en_route", "arrived"] as const;

export type ZoneLoadItem = {
  zoneId: string;
  name: string;
  isActive: boolean;
  waiting: number;
  active: number;
};

async function sumStatuses(zoneId: string, statuses: readonly string[]) {
  const counts = await Promise.all(
    statuses.map((status) => countZoneRescues(zoneId, status)),
  );
  return counts.reduce((sum, count) => sum + count, 0);
}

/** Busiest zones first; ties keep the zone name order. */
export function sortZoneLoad(items: ZoneLoadItem[]): ZoneLoadItem[] {
  return [...items].sort(
    (a, b) =>
      b.waiting + b.active - (a.waiting + a.active) ||
      a.name.localeCompare(b.name, "vi"),
  );
}

export async function getZoneLoad(
  actor: PublicUser,
): Promise<WorkspaceResult<{ items: ZoneLoadItem[] }>> {
  if (actor.role !== "admin") {
    return {
      ok: false,
      status: 403,
      errors: { form: "Bạn không có quyền xem tải cứu hộ theo vùng." },
    };
  }
  const zones = await listServiceZones();
  const items = await Promise.all(
    zones.map(async (zone) => ({
      zoneId: zone.zone_id,
      name: zone.name?.trim() || "Vùng chưa đặt tên",
      isActive: zone.is_active !== false,
      waiting: await sumStatuses(zone.zone_id, WAITING),
      active: await sumStatuses(zone.zone_id, ACTIVE),
    })),
  );
  return { ok: true, data: { items: sortZoneLoad(items) } };
}
