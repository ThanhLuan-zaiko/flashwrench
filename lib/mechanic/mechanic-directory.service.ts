// Bookable mechanic directory for the customer booking picker.
// Services own every rule; the repository only runs raw CQL.

import { findUserById } from "@/lib/auth/user.repository";
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
  lat: number | null;
  lng: number | null;
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

async function activeMechanicUser(mechanicId: string): Promise<boolean> {
  const user = await findUserById(mechanicId);
  return user?.role === "mechanic" && user.status === "active";
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
  const seen = new Set<string>();
  for (const row of rows) {
    if (seen.has(row.mechanic_id)) continue;
    seen.add(row.mechanic_id);
    if (row.is_verified !== true) continue;
    if (row.is_online !== true) continue;
    const [accountOk, profile] = await Promise.all([
      activeMechanicUser(row.mechanic_id),
      findMechanicProfileRow(row.mechanic_id),
    ]);
    if (!accountOk || !profile) {
      await deleteAvailableMechanic(
        toDecimalOr(row.rating_avg, 0),
        row.mechanic_id,
      );
      continue;
    }
    if (
      profile.is_verified !== true ||
      profile.is_online !== true ||
      profile.is_available !== true
    ) {
      await deleteAvailableMechanic(
        toDecimalOr(row.rating_avg, 0),
        row.mechanic_id,
      );
      continue;
    }
    const base =
      typeof profile.base_lat === "number" &&
      typeof profile.base_lng === "number"
        ? { lat: profile.base_lat, lng: profile.base_lng }
        : null;
    items.push({
      id: row.mechanic_id,
      displayName:
        profile.display_name?.trim() ||
        row.display_name?.trim() ||
        "Thợ FlashWrench",
      skills: (profile.skills ?? row.skills ?? [])
        .map((skill) => skill.trim())
        .filter(Boolean),
      ratingAvg: toDecimalOr(profile.rating_avg ?? row.rating_avg),
      ratingCount: toNumberOr(profile.rating_count ?? row.rating_count),
      completedJobs: toNumberOr(profile.completed_jobs ?? row.completed_jobs),
      isOnline: true,
      lat: base?.lat ?? null,
      lng: base?.lng ?? null,
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
    await deleteAvailableMechanic(0, mechanicId);
    return;
  }
  const rating = toDecimalOr(profile.rating_avg, 0);
  const accountOk = await activeMechanicUser(mechanicId);
  const listable =
    accountOk &&
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
