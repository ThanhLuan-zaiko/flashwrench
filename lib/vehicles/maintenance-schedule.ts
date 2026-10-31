// Pure maintenance cadence math: next due date and km after a visit, the
// shop-local due month, and the deterministic holdout split. No DB here.

import { DEFAULT_TIME_ZONE } from "@/lib/datetime/timezone";
import { monthKey } from "@/lib/mechanic/mechanic-period";

export const HOLDOUT_PERCENT = 10;

export type ServiceCadence = {
  intervalMonths: number | null;
  intervalKm: number | null;
};

export type NextDue = {
  dueAt: Date | null;
  dueKm: number | null;
};

// Shortest cadence across the visit's services wins: a reminder that comes
// early is cheaper for the customer than one that arrives after the car
// already needed the work.
export function computeNextDue(input: {
  servedAt: Date;
  odometerKm: number | null;
  cadences: ServiceCadence[];
}): NextDue {
  const months = input.cadences
    .map((cadence) => cadence.intervalMonths)
    .filter((value): value is number => value !== null && value > 0);
  const kms = input.cadences
    .map((cadence) => cadence.intervalKm)
    .filter((value): value is number => value !== null && value > 0);

  let dueAt: Date | null = null;
  if (months.length > 0) {
    dueAt = addMonthsUtc(input.servedAt, Math.min(...months));
  }
  let dueKm: number | null = null;
  if (kms.length > 0 && input.odometerKm !== null) {
    dueKm = input.odometerKm + Math.min(...kms);
  }
  return { dueAt, dueKm };
}

function addMonthsUtc(date: Date, months: number): Date {
  const next = new Date(date.getTime());
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

// Reminders are keyed by shop-local month so the scanner reads one
// partition per month.
export function dueMonthOf(dueAt: Date): string {
  return monthKey(dueAt, DEFAULT_TIME_ZONE);
}

// FNV-1a over the vehicle id: stable across runs and replicas, so a vehicle
// stays in the same group for its whole life.
export function isHoldoutVehicle(
  vehicleId: string,
  percent: number = HOLDOUT_PERCENT,
): boolean {
  let hash = 0x811c9dc5;
  for (let i = 0; i < vehicleId.length; i += 1) {
    hash ^= vehicleId.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash % 100 < percent;
}

export function reminderGroupOf(vehicleId: string): "holdout" | "treatment" {
  return isHoldoutVehicle(vehicleId) ? "holdout" : "treatment";
}
