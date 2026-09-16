// Business logic for the navigation board: the mechanic origin (live GPS
// position, falling back to the garage base) plus every open job that has
// real coordinates, each with a distance and travel-time hint. Jobs without
// coordinates or with an unknown status are left out instead of guessing.

import {
  type MechanicBookingRow,
  type MechanicFieldErrors,
  type MechanicNavigationBoard,
  type MechanicResult,
  type MechanicSavedLocation,
  type MechanicWorkloadRow,
  toIso,
} from "./mechanic.types";
import {
  listBookingItemRowsByBookingIds,
  listBookingRowsByIds,
  listWorkloadRows,
} from "./mechanic-bookings.repository";
import {
  estimateEtaMin,
  haversineKm,
  isValidLatitude,
  isValidLongitude,
} from "./mechanic-geo";
import { groupItemsByBooking, toBookingStatus } from "./mechanic-mapper";
import { isOpenBookingStatus } from "./mechanic-status";
import {
  findMechanicLocationRow,
  findMechanicProfileRow,
  upsertMechanicLocation,
} from "./mechanic-workspace.repository";

export const MECHANIC_NAVIGATION_SCAN_LIMIT = 30;

type NavigationOrigin = NonNullable<MechanicNavigationBoard["origin"]>;
type NavigationCurrentType = MechanicNavigationBoard["currentJobType"];

function fieldError<T>(
  status: number,
  errors: MechanicFieldErrors,
): MechanicResult<T> {
  return { ok: false, status, errors };
}

function currentJobTypeOf(value: string | null): NavigationCurrentType {
  return value === "booking" || value === "emergency" ? value : "none";
}

/** Live GPS when the mechanic shares it, otherwise the garage base. */
async function resolveOrigin(
  mechanicId: string,
): Promise<{ origin: NavigationOrigin | null; savedAt: string | null }> {
  const [location, profile] = await Promise.all([
    findMechanicLocationRow(mechanicId),
    findMechanicProfileRow(mechanicId),
  ]);
  const savedAt = toIso(location?.updated_at ?? null);

  if (
    location &&
    isValidLatitude(location.lat) &&
    isValidLongitude(location.lng)
  ) {
    return {
      origin: {
        lat: location.lat,
        lng: location.lng,
        label: "Vị trí hiện tại của bạn",
      },
      savedAt,
    };
  }
  if (
    profile &&
    isValidLatitude(profile.base_lat) &&
    isValidLongitude(profile.base_lng)
  ) {
    return {
      origin: {
        lat: profile.base_lat,
        lng: profile.base_lng,
        label: "Điểm xuất phát (xưởng)",
      },
      savedAt,
    };
  }
  return { origin: null, savedAt };
}

function currentJobIdOf(
  rows: MechanicWorkloadRow[],
  savedJobId: string | null,
): string | null {
  if (savedJobId && rows.some((row) => row.booking_id === savedJobId)) {
    return savedJobId;
  }
  const active = rows.find(
    (row) => row.status === "en_route" || row.status === "in_progress",
  );
  return active?.booking_id ?? rows[0]?.booking_id ?? null;
}

export async function getNavigationBoard(
  mechanicId: string,
): Promise<MechanicResult<MechanicNavigationBoard>> {
  const [rows, location] = await Promise.all([
    listWorkloadRows(mechanicId, MECHANIC_NAVIGATION_SCAN_LIMIT),
    findMechanicLocationRow(mechanicId),
  ]);
  const open = rows.filter((row) => {
    const status = toBookingStatus(row.status);
    return status !== null && isOpenBookingStatus(status);
  });
  const bookingIds = open.map((row) => row.booking_id);
  const [originResult, details, itemGroups] = await Promise.all([
    resolveOrigin(mechanicId),
    listBookingRowsByIds(bookingIds),
    listBookingItemRowsByBookingIds(bookingIds),
  ]);
  const detailById = new Map(
    details.map((detail) => [detail.booking_id, detail]),
  );
  const itemsByBooking = groupItemsByBooking(itemGroups);
  const { origin } = originResult;

  const targets: MechanicNavigationBoard["targets"] = [];
  for (const row of open) {
    const detail: MechanicBookingRow | null =
      detailById.get(row.booking_id) ?? null;
    const status = toBookingStatus(row.status ?? detail?.status ?? null);
    const lat = detail?.address?.lat ?? null;
    const lng = detail?.address?.lng ?? null;
    if (!status || !isOpenBookingStatus(status)) continue;
    if (
      typeof lat !== "number" ||
      typeof lng !== "number" ||
      !isValidLatitude(lat) ||
      !isValidLongitude(lng)
    ) {
      continue;
    }
    const addressText =
      detail?.address?.full_text && detail.address.full_text.length > 0
        ? detail.address.full_text
        : "Chưa có địa chỉ chi tiết";
    const distanceKm = origin ? haversineKm(origin, { lat, lng }) : 0;
    targets.push({
      bookingId: row.booking_id,
      customerName: detail?.customer_name ?? row.customer_name ?? "",
      addressText,
      lat,
      lng,
      status,
      scheduledAt: toIso(row.scheduled_at ?? detail?.scheduled_at ?? null),
      distanceKm,
      etaMin: origin ? estimateEtaMin(distanceKm) : 0,
      serviceNames: (itemsByBooking.get(row.booking_id) ?? [])
        .map((item) => item.serviceName)
        .filter((name) => name.length > 0),
    });
  }

  targets.sort((left, right) => {
    if (left.distanceKm !== right.distanceKm) {
      return left.distanceKm - right.distanceKm;
    }
    const leftAt = left.scheduledAt ? new Date(left.scheduledAt).getTime() : 0;
    const rightAt = right.scheduledAt
      ? new Date(right.scheduledAt).getTime()
      : 0;
    return leftAt - rightAt;
  });

  return {
    ok: true,
    data: {
      origin,
      currentJobId: currentJobIdOf(open, location?.current_job_id ?? null),
      currentJobType: currentJobTypeOf(location?.current_job_type ?? null),
      targets,
      locationSavedAt: originResult.savedAt,
    },
  };
}
export type SaveMechanicLocationInput = {
  latitude: unknown;
  longitude: unknown;
  currentJobId?: unknown;
  currentJobType?: unknown;
};

function readJobType(value: unknown): NavigationCurrentType {
  if (value === "booking" || value === "emergency") return value;
  return "none";
}

// The app marks itself busy on the map the same time it shares GPS: the
// saved row is timestamped so the board can show how fresh the position is.
export async function saveMechanicLocation(
  mechanicId: string,
  input: SaveMechanicLocationInput,
): Promise<MechanicResult<MechanicSavedLocation>> {
  const { latitude, longitude, currentJobId, currentJobType } = input;
  const errors: MechanicFieldErrors = {};
  if (!isValidLatitude(latitude)) {
    errors.latitude = "Vĩ độ không hợp lệ (từ -90 đến 90).";
  }
  if (!isValidLongitude(longitude)) {
    errors.longitude = "Kinh độ không hợp lệ (từ -180 đến 180).";
  }
  const jobId =
    typeof currentJobId === "string" && currentJobId.length > 0
      ? currentJobId
      : null;
  if (Object.keys(errors).length > 0) return fieldError(400, errors);

  const savedAt = new Date();
  const jobType = readJobType(currentJobType);
  await upsertMechanicLocation({
    mechanicId,
    lat: latitude as number,
    lng: longitude as number,
    currentJobId: jobType === "none" ? null : jobId,
    currentJobType: jobType,
    updatedAt: savedAt,
  });
  return {
    ok: true,
    data: {
      lat: latitude as number,
      lng: longitude as number,
      currentJobId: jobType === "none" ? null : jobId,
      currentJobType: jobType,
      updatedAt: savedAt.toISOString(),
    },
  };
}
