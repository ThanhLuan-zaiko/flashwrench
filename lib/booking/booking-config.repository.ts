// Raw CQL for booking intake tuning. Single row (config_id='default');
// missing rows fall back to code defaults in the service.
import { scylla } from "@/lib/db/client";

export type BookingConfigRow = {
  config_id: string;
  min_lead_days: number | null;
  max_advance_days: number | null;
  cancel_cutoff_hours: number | null;
  guest_booking_enabled: boolean | null;
  updated_at: Date | null;
  updated_by: string | null;
};

export const BOOKING_CONFIG_ID = "default";

function toIntOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.trunc(value)
    : null;
}

export async function findBookingConfig(): Promise<BookingConfigRow | null> {
  const result = await scylla.execute(
    "SELECT config_id, min_lead_days, max_advance_days, cancel_cutoff_hours, guest_booking_enabled, updated_at, updated_by FROM booking_config WHERE config_id = ?",
    [BOOKING_CONFIG_ID],
    { prepare: true },
  );
  const raw = result.first() as unknown as Record<string, unknown> | null;
  if (!raw) return null;
  const updatedAt = raw.updated_at;
  return {
    config_id: String(raw.config_id),
    min_lead_days: toIntOrNull(raw.min_lead_days),
    max_advance_days: toIntOrNull(raw.max_advance_days),
    cancel_cutoff_hours: toIntOrNull(raw.cancel_cutoff_hours),
    guest_booking_enabled:
      raw.guest_booking_enabled === null ||
      raw.guest_booking_enabled === undefined
        ? null
        : raw.guest_booking_enabled === true,
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

export type SaveBookingConfigParams = {
  minLeadDays: number;
  maxAdvanceDays: number;
  cancelCutoffHours: number;
  guestBookingEnabled: boolean;
  updatedBy: string;
  updatedAt: Date;
};

export async function saveBookingConfig(
  params: SaveBookingConfigParams,
): Promise<void> {
  await scylla.execute(
    "INSERT INTO booking_config (config_id, min_lead_days, max_advance_days, cancel_cutoff_hours, guest_booking_enabled, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      BOOKING_CONFIG_ID,
      params.minLeadDays,
      params.maxAdvanceDays,
      params.cancelCutoffHours,
      params.guestBookingEnabled,
      params.updatedAt,
      params.updatedBy,
    ],
    { prepare: true },
  );
}
