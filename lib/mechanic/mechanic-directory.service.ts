// Bookable mechanic directory for the customer booking picker.
// Services own every rule; the repository only runs raw CQL.

import { type MechanicResult, toDecimalOr, toNumberOr } from "./mechanic.types";
import {
  deleteAvailableMechanic,
  listAvailableMechanicRows,
  upsertAvailableMechanic,
} from "./mechanic-directory.repository";
import {
  type GeoPoint,
  haversineKm,
  isValidLatitude,
  isValidLongitude,
} from "./mechanic-geo";
import { findMechanicProfileRow } from "./mechanic-workspace.repository";

export const MECHANIC_DIRECTORY_LIMIT = 20;
export const MECHANIC_DIRECTORY_MAX_LIMIT = 50;

export type MechanicDirectoryItem = {
  id: string;
  displayName: string;
  skills: string[];
  ratingAvg: number;
  ratingCount: number;
  completedJobs: number;
  isOnline: boolean;
  distanceKm: number | null;
};

export type ListMechanicsParams = {
  lat?: number;
  lng?: number;
  limit?: number;
};

function resolveLimit(limit?: number): number {
  if (typeof limit !== "number" || !Number.isFinite(limit) || limit <= 0) {
    return MECHANIC_DIRECTORY_LIMIT;
  }
  return Math.min(Math.trunc(limit), MECHANIC_DIRECTORY_MAX_LIMIT);
}

function resolveOrigin(lat?: number, lng?: number): GeoPoint | null {
  if (!isValidLatitude(lat) || !isValidLongitude(lng)) return null;
  return { lat, lng };
}

function formError<T>(status: number, form: string): MechanicResult<T> {
  return { ok: false, status, errors: { form } };
}

// One bounded partition read, then filter and enrich in memory: the
// directory stays small (bookable mechanics only) and rows missing
// verification or a live connection never reach the picker. With a
// customer location, nearest-first ordering wins over rating order.
export async function listAvailableMechanics(
  params: ListMechanicsParams = {},
): Promise<MechanicResult<MechanicDirectoryItem[]>> {
  const origin = resolveOrigin(params.lat, params.lng);
  if (
    (params.lat !== undefined || params.lng !== undefined) &&
    origin === null
  ) {
    return formError(400, "Tọa độ tìm thợ không hợp lệ.");
  }
  const rows = await listAvailableMechanicRows(resolveLimit(params.limit));
  const items: MechanicDirectoryItem[] = [];
  for (const row of rows) {
    if (row.is_verified !== true) continue;
    if (row.is_online !== true) continue;
    const base =
      typeof row.base_lat === "number" && typeof row.base_lng === "number"
        ? { lat: row.base_lat, lng: row.base_lng }
        : null;
    items.push({
      id: row.mechanic_id,
      displayName: row.display_name?.trim() || "Thợ FlashWrench",
      skills: (row.skills ?? []).map((skill) => skill.trim()).filter(Boolean),
      ratingAvg: toDecimalOr(row.rating_avg),
      ratingCount: toNumberOr(row.rating_count),
      completedJobs: toNumberOr(row.completed_jobs),
      isOnline: true,
      distanceKm: origin && base ? haversineKm(origin, base) : null,
    });
  }
  if (origin) {
    items.sort(
      (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity),
    );
  }
  return { ok: true, data: items };
}

// Keep the directory in sync whenever availability flips: verified and
// online mechanics are listed, everyone else is removed. Deletes reuse
// the live profile rating so entries never orphan: rating_avg has no
// writer outside profile creation in v1, so the key always matches.
export async function syncMechanicDirectory(mechanicId: string): Promise<void> {
  const profile = await findMechanicProfileRow(mechanicId);
  if (!profile) {
    await deleteAvailableMechanic(null, mechanicId);
    return;
  }
  const rating = toDecimalOr(profile.rating_avg, 0);
  const listable =
    profile.is_verified === true &&
    profile.is_online === true &&
    profile.is_available === true;
  if (!listable) {
    await deleteAvailableMechanic(rating, mechanicId);
    return;
  }
  await upsertAvailableMechanic({
    mechanicId,
    displayName: profile.display_name,
    skills: profile.skills,
    baseLat: profile.base_lat,
    baseLng: profile.base_lng,
    isOnline: profile.is_online,
    isVerified: profile.is_verified,
    ratingAvg: rating,
    ratingCount: toNumberOr(profile.rating_count),
    completedJobs: toNumberOr(profile.completed_jobs),
  });
}
