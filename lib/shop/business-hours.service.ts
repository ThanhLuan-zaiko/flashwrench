// Shop working-hours window: a daily [opens, closes) range in the shop
// zone that booking intake enforces on the scheduled slot. The
// single-row business_hours table is optional — absent/disabled rows
// keep today's any-hour rule so intake never hard-fails.
import type { PublicUser } from "@/lib/auth/user.types";
import { normalizeTimeZone } from "@/lib/datetime/timezone";
import { isRecord } from "@/lib/validation";
import {
  findBusinessHours,
  saveBusinessHours,
} from "./business-hours.repository";
import {
  BUSINESS_MINUTES_MAX,
  type BusinessHours,
  type BusinessHoursConfig,
  type BusinessHoursErrors,
  type BusinessHoursResult,
  DEFAULT_BUSINESS_HOURS,
  DEFAULT_BUSINESS_TIME_ZONE,
} from "./business-hours.types";

export type { OpenWindow } from "./business-hours.types";
export {
  BUSINESS_MINUTES_MAX,
  DEFAULT_BUSINESS_HOURS,
  DEFAULT_BUSINESS_TIME_ZONE,
  formatMinutesOfDay,
  openWindowOf,
} from "./business-hours.types";
export type {
  BusinessHours,
  BusinessHoursConfig,
  BusinessHoursErrors,
  BusinessHoursResult,
};

export function defaultBusinessHoursConfig(): BusinessHoursConfig {
  return { ...DEFAULT_BUSINESS_HOURS, isDefault: true, updatedAt: null };
}

function clampMinutes(value: number | null, fallback: number): number {
  if (value === null || !Number.isInteger(value)) return fallback;
  return Math.min(BUSINESS_MINUTES_MAX, Math.max(0, value));
}

// Hot-path read for booking intake and the public endpoint: read
// failures degrade to disabled (any hour), and stored values are
// clamped back into bounds so a hand-edited row can never lock intake.
export async function getBusinessHoursPolicy(): Promise<BusinessHours> {
  try {
    const row = await findBusinessHours();
    if (!row) return DEFAULT_BUSINESS_HOURS;
    const opensAtMin = clampMinutes(
      row.opens_at_min,
      DEFAULT_BUSINESS_HOURS.opensAtMin,
    );
    const closesAtMin = clampMinutes(
      row.closes_at_min,
      DEFAULT_BUSINESS_HOURS.closesAtMin,
    );
    // A stored close at/before open leaves a zero-width window — treat
    // the row as disabled rather than rejecting every schedule.
    const enabled = row.enabled === true && closesAtMin > opensAtMin;
    return {
      enabled,
      opensAtMin,
      closesAtMin,
      timeZone: normalizeTimeZone(row.timezone) ?? DEFAULT_BUSINESS_TIME_ZONE,
    };
  } catch {
    return DEFAULT_BUSINESS_HOURS;
  }
}

export async function getBusinessHoursConfig(): Promise<BusinessHoursConfig> {
  const row = await findBusinessHours();
  if (!row) return defaultBusinessHoursConfig();
  return {
    enabled: row.enabled === true,
    opensAtMin: row.opens_at_min ?? DEFAULT_BUSINESS_HOURS.opensAtMin,
    closesAtMin: row.closes_at_min ?? DEFAULT_BUSINESS_HOURS.closesAtMin,
    timeZone: row.timezone ?? DEFAULT_BUSINESS_TIME_ZONE,
    isDefault: false,
    updatedAt: row.updated_at?.toISOString() ?? null,
  };
}

function fail<T>(status: number, form: string): BusinessHoursResult<T> {
  return { ok: false, status, errors: { form } };
}

function inRange(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= BUSINESS_MINUTES_MAX;
}

export async function updateBusinessHours(
  actor: PublicUser,
  raw: unknown,
): Promise<BusinessHoursResult<{ hours: BusinessHoursConfig }>> {
  if (actor.role !== "admin") {
    return fail(403, "Bạn không có quyền thực hiện thao tác này.");
  }
  if (!isRecord(raw)) {
    return fail(400, "Dữ liệu gửi lên không hợp lệ.");
  }
  const enabled = raw.enabled === true;
  const opensAtMin = Number(raw.opensAtMin);
  const closesAtMin = Number(raw.closesAtMin);
  const errors: BusinessHoursErrors = {};
  if (!inRange(opensAtMin)) {
    errors.opensAtMin = "Giờ mở cửa từ 00:00 đến 23:59.";
  }
  if (!inRange(closesAtMin)) {
    errors.closesAtMin = "Giờ đóng cửa từ 00:00 đến 23:59.";
  } else if (inRange(opensAtMin) && closesAtMin <= opensAtMin) {
    // Overnight windows are out of scope — shops close before midnight.
    errors.closesAtMin = "Giờ đóng cửa phải sau giờ mở cửa.";
  }
  const timeZone =
    normalizeTimeZone(raw.timeZone) ?? DEFAULT_BUSINESS_TIME_ZONE;
  if (Object.keys(errors).length > 0) {
    return { ok: false, status: 400, errors };
  }
  const at = new Date();
  await saveBusinessHours({
    enabled,
    opensAtMin,
    closesAtMin,
    timeZone,
    updatedBy: actor.id,
    updatedAt: at,
  });
  return {
    ok: true,
    data: {
      hours: {
        enabled,
        opensAtMin,
        closesAtMin,
        timeZone,
        isDefault: false,
        updatedAt: at.toISOString(),
      },
    },
  };
}
