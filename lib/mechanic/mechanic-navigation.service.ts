// Business logic for the navigation board: the mechanic origin (live GPS
// position, falling back to the garage base) plus every open job that has
// real coordinates, each with a distance and travel-time hint. Jobs without
// coordinates or with an unknown status are left out instead of guessing.

import { listOrderRowsByCourier } from "@/lib/orders/orders.repository";
import type { OrderRow } from "@/lib/orders/orders.types";
import {
  type MechanicBookingRow,
  type MechanicNavigationBoard,
  type MechanicResult,
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
import { orderNavigationTargets } from "./mechanic-order-targets";
import { isOpenBookingStatus } from "./mechanic-status";
import {
  findMechanicLocationRow,
  findMechanicProfileRow,
} from "./mechanic-workspace.repository";

export const MECHANIC_NAVIGATION_SCAN_LIMIT = 30;

type NavigationOrigin = NonNullable<MechanicNavigationBoard["origin"]>;
type NavigationCurrentType = MechanicNavigationBoard["currentJobType"];

export type { SaveMechanicLocationInput } from "./mechanic-location.service";
export { saveMechanicLocation } from "./mechanic-location.service";

function currentJobTypeOf(value: string | null): NavigationCurrentType {
  return value === "booking" || value === "emergency" || value === "order"
    ? value
    : "none";
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
  orderRows: OrderRow[],
  savedJobId: string | null,
): string | null {
  if (
    savedJobId &&
    (rows.some((row) => row.booking_id === savedJobId) ||
      orderRows.some((row) => row.order_id === savedJobId))
  ) {
    return savedJobId;
  }
  const active = rows.find(
    (row) => row.status === "en_route" || row.status === "in_progress",
  );
  return (
    active?.booking_id ?? orderRows[0]?.order_id ?? rows[0]?.booking_id ?? null
  );
}

export async function getNavigationBoard(
  mechanicId: string,
): Promise<MechanicResult<MechanicNavigationBoard>> {
  const [rows, location, courierOrders] = await Promise.all([
    listWorkloadRows(mechanicId, MECHANIC_NAVIGATION_SCAN_LIMIT),
    findMechanicLocationRow(mechanicId),
    listOrderRowsByCourier(mechanicId, MECHANIC_NAVIGATION_SCAN_LIMIT),
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
      kind: "booking",
      bookingId: row.booking_id,
      customerName: detail?.customer_name ?? row.customer_name ?? "",
      addressText,
      lat,
      lng,
      status,
      scheduledAt: toIso(row.scheduled_at ?? detail?.scheduled_at ?? null),
      timezone: detail?.timezone ?? null,
      distanceKm,
      etaMin: origin ? estimateEtaMin(distanceKm) : 0,
      serviceNames: (itemsByBooking.get(row.booking_id) ?? [])
        .map((item) => item.serviceName)
        .filter((name) => name.length > 0),
      codAmount: null,
      codeIssued: false,
    });
  }

  // Delivery jobs assigned to this mechanic appear next to bookings: the
  // order ships while status is shipping, and the shipping address is the
  // destination the customer pinned at checkout.
  const openOrders = courierOrders.filter((row) => row.status === "shipping");
  targets.push(...orderNavigationTargets(courierOrders, origin));

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
      currentJobId: currentJobIdOf(
        open,
        openOrders,
        location?.current_job_id ?? null,
      ),
      currentJobType: currentJobTypeOf(location?.current_job_type ?? null),
      targets,
      locationSavedAt: originResult.savedAt,
    },
  };
}
