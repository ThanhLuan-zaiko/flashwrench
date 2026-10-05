// Pure constants and shared shapes for the shop working-hours window.
// No DB imports — the booking form and admin card import this module
// from client bundles, so it must stay free of the Scylla client.
import { DEFAULT_TIME_ZONE } from "@/lib/datetime/timezone";

// Minutes since midnight, so 07:30 is 450. Window is [opens, closes) in
// the shop zone — overnight ranges are rejected (opens >= closes).
export const BUSINESS_MINUTES_MAX = 24 * 60 - 1;
export const DEFAULT_OPENS_AT_MIN = 7 * 60;
export const DEFAULT_CLOSES_AT_MIN = 20 * 60;
export const DEFAULT_BUSINESS_TIME_ZONE = DEFAULT_TIME_ZONE;

export type BusinessHours = {
  enabled: boolean;
  opensAtMin: number;
  closesAtMin: number;
  timeZone: string;
};

export type BusinessHoursConfig = BusinessHours & {
  isDefault: boolean;
  updatedAt: string | null;
};

export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  enabled: false,
  opensAtMin: DEFAULT_OPENS_AT_MIN,
  closesAtMin: DEFAULT_CLOSES_AT_MIN,
  timeZone: DEFAULT_BUSINESS_TIME_ZONE,
};

// The slot-shaped subset the booking validator needs — a time-of-day
// window in one named zone. Pure shape, shared client/server.
export type OpenWindow = {
  opensAtMin: number;
  closesAtMin: number;
  timeZone: string;
};

export function openWindowOf(hours: BusinessHours): OpenWindow | null {
  return hours.enabled
    ? {
        opensAtMin: hours.opensAtMin,
        closesAtMin: hours.closesAtMin,
        timeZone: hours.timeZone,
      }
    : null;
}

/** 420 -> "07:00". Kept pure so labels and error messages stay in sync. */
export function formatMinutesOfDay(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export type BusinessHoursErrors = Partial<
  Record<"enabled" | "opensAtMin" | "closesAtMin" | "timeZone" | "form", string>
>;

export type BusinessHoursResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; errors: BusinessHoursErrors };
