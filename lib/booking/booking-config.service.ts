// Booking intake tuning for admins: the lead-time window a customer must
// book inside, and the cutoff for self-serve cancels. The single-row
// booking_config table is optional — a missing table or row falls back to
// the code defaults so a fresh keyspace keeps today's rules and booking
// intake never hard-fails on a skipped migration.
import type { PublicUser } from "@/lib/auth/user.types";
import { isRecord } from "@/lib/validation";
import {
  findBookingConfig,
  saveBookingConfig,
} from "./booking-config.repository";
import {
  type BookingConfig,
  type BookingConfigResult,
  type BookingPolicy,
  CANCEL_CUTOFF_HOURS_MAX,
  CANCEL_CUTOFF_HOURS_MIN,
  DEFAULT_CANCEL_CUTOFF_HOURS,
  DEFAULT_GUEST_BOOKING_ENABLED,
  DEFAULT_MAX_ADVANCE_DAYS,
  DEFAULT_MIN_LEAD_DAYS,
  MAX_ADVANCE_DAYS_MAX,
  MAX_ADVANCE_DAYS_MIN,
  MIN_LEAD_DAYS_MAX,
  MIN_LEAD_DAYS_MIN,
} from "./booking-config.types";

// Re-exported so route handlers and services keep a single import site;
// client bundles should import booking-config.types directly instead.
export type { BookingConfig, BookingConfigResult, BookingPolicy };
export {
  CANCEL_CUTOFF_HOURS_MAX,
  CANCEL_CUTOFF_HOURS_MIN,
  DEFAULT_MIN_LEAD_DAYS,
  MAX_ADVANCE_DAYS_MAX,
  MAX_ADVANCE_DAYS_MIN,
  MIN_LEAD_DAYS_MAX,
  MIN_LEAD_DAYS_MIN,
};

function defaultPolicy(): BookingPolicy {
  return {
    minLeadDays: DEFAULT_MIN_LEAD_DAYS,
    maxAdvanceDays: DEFAULT_MAX_ADVANCE_DAYS,
    cancelCutoffHours: DEFAULT_CANCEL_CUTOFF_HOURS,
    guestBookingEnabled: DEFAULT_GUEST_BOOKING_ENABLED,
  };
}

export function defaultBookingConfig(): BookingConfig {
  return { ...defaultPolicy(), isDefault: true, updatedAt: null };
}

export async function getBookingConfig(): Promise<BookingConfig> {
  const row = await findBookingConfig();
  if (!row) return defaultBookingConfig();
  return {
    minLeadDays: row.min_lead_days ?? DEFAULT_MIN_LEAD_DAYS,
    maxAdvanceDays: row.max_advance_days ?? DEFAULT_MAX_ADVANCE_DAYS,
    cancelCutoffHours: row.cancel_cutoff_hours ?? DEFAULT_CANCEL_CUTOFF_HOURS,
    guestBookingEnabled:
      row.guest_booking_enabled ?? DEFAULT_GUEST_BOOKING_ENABLED,
    isDefault: false,
    updatedAt: row.updated_at?.toISOString() ?? null,
  };
}

// Hot-path read for booking intake, cancels and the public endpoint: any
// read failure (skipped migration, dropped table) degrades to the code
// defaults instead of rejecting checkouts, and stored values are clamped
// back into bounds so a hand-edited row can never lock customers out.
// Admin reads use getBookingConfig and surface errors normally.
export async function getBookingPolicy(): Promise<BookingPolicy> {
  try {
    const row = await findBookingConfig();
    if (!row) return defaultPolicy();
    const minLeadDays = clampInt(
      row.min_lead_days,
      MIN_LEAD_DAYS_MIN,
      MIN_LEAD_DAYS_MAX,
      DEFAULT_MIN_LEAD_DAYS,
    );
    let maxAdvanceDays = clampInt(
      row.max_advance_days,
      MAX_ADVANCE_DAYS_MIN,
      MAX_ADVANCE_DAYS_MAX,
      DEFAULT_MAX_ADVANCE_DAYS,
    );
    // A cap at/below the floor leaves a zero-width window — treat as no
    // cap rather than rejecting every schedule.
    if (maxAdvanceDays > 0 && maxAdvanceDays <= minLeadDays) {
      maxAdvanceDays = 0;
    }
    return {
      minLeadDays,
      maxAdvanceDays,
      cancelCutoffHours: clampInt(
        row.cancel_cutoff_hours,
        CANCEL_CUTOFF_HOURS_MIN,
        CANCEL_CUTOFF_HOURS_MAX,
        DEFAULT_CANCEL_CUTOFF_HOURS,
      ),
      // Only an explicit stored false closes guest intake — a legacy row
      // without the column keeps the default.
      guestBookingEnabled: row.guest_booking_enabled !== false,
    };
  } catch {
    return defaultPolicy();
  }
}

function clampInt(
  value: number | null,
  min: number,
  max: number,
  fallback: number,
): number {
  if (value === null || !Number.isInteger(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function fail<T>(status: number, form: string): BookingConfigResult<T> {
  return { ok: false, status, errors: { form } };
}

function inRange(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

export async function updateBookingConfig(
  actor: PublicUser,
  raw: unknown,
): Promise<BookingConfigResult<{ config: BookingConfig }>> {
  if (actor.role !== "admin") {
    return fail(403, "Bạn không có quyền thực hiện thao tác này.");
  }
  if (!isRecord(raw)) {
    return fail(400, "Dữ liệu gửi lên không hợp lệ.");
  }
  const minLeadDays = Number(raw.minLeadDays);
  const maxAdvanceDays = Number(raw.maxAdvanceDays);
  const cancelCutoffHours = Number(raw.cancelCutoffHours);
  const guestBookingEnabled =
    typeof raw.guestBookingEnabled === "boolean"
      ? raw.guestBookingEnabled
      : null;
  const errors: Record<string, string> = {};
  if (!inRange(minLeadDays, MIN_LEAD_DAYS_MIN, MIN_LEAD_DAYS_MAX)) {
    errors.minLeadDays = `Đặt trước tối thiểu từ ${MIN_LEAD_DAYS_MIN} đến ${MIN_LEAD_DAYS_MAX} ngày.`;
  }
  if (!inRange(maxAdvanceDays, MAX_ADVANCE_DAYS_MIN, MAX_ADVANCE_DAYS_MAX)) {
    errors.maxAdvanceDays = `Đặt xa tối đa từ ${MAX_ADVANCE_DAYS_MIN} đến ${MAX_ADVANCE_DAYS_MAX} ngày (0 = không giới hạn).`;
  } else if (maxAdvanceDays > 0 && maxAdvanceDays <= minLeadDays) {
    // A cap at/below the floor leaves a zero-width booking window.
    errors.maxAdvanceDays = "Đặt xa tối đa phải lớn hơn đặt trước tối thiểu.";
  }
  if (
    !inRange(
      cancelCutoffHours,
      CANCEL_CUTOFF_HOURS_MIN,
      CANCEL_CUTOFF_HOURS_MAX,
    )
  ) {
    errors.cancelCutoffHours = `Hạn hủy từ ${CANCEL_CUTOFF_HOURS_MIN} đến ${CANCEL_CUTOFF_HOURS_MAX} giờ (0 = hủy bất cứ lúc nào).`;
  }
  if (guestBookingEnabled === null) {
    errors.guestBookingEnabled = "Trạng thái đặt lịch khách không hợp lệ.";
  }
  if (guestBookingEnabled === null || Object.keys(errors).length > 0) {
    return { ok: false, status: 400, errors };
  }
  const at = new Date();
  await saveBookingConfig({
    minLeadDays,
    maxAdvanceDays,
    cancelCutoffHours,
    guestBookingEnabled,
    updatedBy: actor.id,
    updatedAt: at,
  });
  return {
    ok: true,
    data: {
      config: {
        minLeadDays,
        maxAdvanceDays,
        cancelCutoffHours,
        guestBookingEnabled,
        isDefault: false,
        updatedAt: at.toISOString(),
      },
    },
  };
}
