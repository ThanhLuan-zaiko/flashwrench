// Raw CQL for the shop working-hours window. Single row
// (config_id='default'); missing rows fall back to code defaults.
import { scylla } from "@/lib/db/client";

export type BusinessHoursRow = {
  config_id: string;
  enabled: boolean | null;
  opens_at_min: number | null;
  closes_at_min: number | null;
  timezone: string | null;
  updated_at: Date | null;
  updated_by: string | null;
};

export const BUSINESS_HOURS_ID = "default";

function toIntOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.trunc(value)
    : null;
}

export async function findBusinessHours(): Promise<BusinessHoursRow | null> {
  const result = await scylla.execute(
    "SELECT config_id, enabled, opens_at_min, closes_at_min, timezone, updated_at, updated_by FROM business_hours WHERE config_id = ?",
    [BUSINESS_HOURS_ID],
    { prepare: true },
  );
  const raw = result.first() as unknown as Record<string, unknown> | null;
  if (!raw) return null;
  const updatedAt = raw.updated_at;
  return {
    config_id: String(raw.config_id),
    enabled:
      raw.enabled === null || raw.enabled === undefined
        ? null
        : raw.enabled === true,
    opens_at_min: toIntOrNull(raw.opens_at_min),
    closes_at_min: toIntOrNull(raw.closes_at_min),
    timezone:
      typeof raw.timezone === "string" && raw.timezone.trim() !== ""
        ? raw.timezone
        : null,
    updated_at:
      updatedAt instanceof Date && !Number.isNaN(updatedAt.getTime())
        ? updatedAt
        : null,
    updated_by:
      raw.updated_by === null || raw.updated_by === undefined
        ? null
        : String(raw.updated_by),
  };
}

export type SaveBusinessHoursParams = {
  enabled: boolean;
  opensAtMin: number;
  closesAtMin: number;
  timeZone: string;
  updatedBy: string;
  updatedAt: Date;
};

export async function saveBusinessHours(
  params: SaveBusinessHoursParams,
): Promise<void> {
  await scylla.execute(
    "INSERT INTO business_hours (config_id, enabled, opens_at_min, closes_at_min, timezone, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      BUSINESS_HOURS_ID,
      params.enabled,
      params.opensAtMin,
      params.closesAtMin,
      params.timeZone,
      params.updatedAt,
      params.updatedBy,
    ],
    { prepare: true },
  );
}
