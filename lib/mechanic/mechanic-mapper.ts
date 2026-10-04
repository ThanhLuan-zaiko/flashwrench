// Row-to-API mapping for the mechanic workspace. Pure functions so the
// rules stay testable and every service maps rows the same way.
import {
  type MechanicBookingItem,
  type MechanicBookingItemRow,
  type MechanicBookingRow,
  type MechanicBookingStatus,
  type MechanicBookingSummary,
  type MechanicBookingTimelineEntry,
  type MechanicPaymentState,
  type MechanicStatusHistoryRow,
  type MechanicWorkloadRow,
  toIso,
  toNumberOr,
} from "./mechanic.types";
import { parseBookingStatus } from "./mechanic-status";

// payment_status vocabulary from schema.cql: unpaid | partial | paid | refunded.
export function toPaymentState(raw: string | null): MechanicPaymentState {
  if (raw === "paid") return "paid";
  if (raw === "partial") return "partial";
  if (raw === "refunded") return "refunded";
  return "unpaid";
}

export function toBookingItem(
  row: MechanicBookingItemRow,
): MechanicBookingItem {
  return {
    serviceId: row.service_id,
    serviceName: row.service_name ?? "",
    quantity: toNumberOr(row.quantity, 1),
    unitPrice: toNumberOr(row.unit_price),
    lineTotal: toNumberOr(row.line_total),
    durationMin: row.duration_min ?? null,
    priceUnit:
      row.price_unit === "per_hour" || row.price_unit === "per_item"
        ? row.price_unit
        : "per_job",
  };
}

/** Groups line items by booking so callers read them without a second pass. */
export function groupItemsByBooking(
  rows: MechanicBookingItemRow[],
): Map<string, MechanicBookingItem[]> {
  const grouped = new Map<string, MechanicBookingItem[]>();
  for (const row of rows) {
    const current = grouped.get(row.booking_id);
    const item = toBookingItem(row);
    if (current) {
      current.push(item);
    } else {
      grouped.set(row.booking_id, [item]);
    }
  }
  for (const items of grouped.values()) {
    items.sort((a, b) => a.serviceName.localeCompare(b.serviceName, "vi"));
  }
  return grouped;
}

export type SummaryParts = {
  workload: MechanicWorkloadRow;
  detail: MechanicBookingRow | null;
  items: MechanicBookingItem[];
  status: MechanicBookingStatus;
};

// The workload table is thin by design, so any detail the mechanic needs
// (phone, address, notes) comes from bookings_by_id when it is available.
export function toBookingSummary(parts: SummaryParts): MechanicBookingSummary {
  const { workload, detail, items, status } = parts;
  const scheduledAt = workload.scheduled_at ?? detail?.scheduled_at ?? null;
  return {
    id: workload.booking_id,
    customerName: detail?.customer_name ?? workload.customer_name ?? "",
    customerPhone: detail?.customer_phone ?? "",
    vehiclePlate: detail?.vehicle_plate ?? workload.vehicle_plate ?? "",
    vehicleBrand: detail?.vehicle_brand ?? "",
    vehicleModel: detail?.vehicle_model ?? "",
    addressText: detail?.address?.full_text ?? "",
    addressLat: detail?.address?.lat ?? null,
    addressLng: detail?.address?.lng ?? null,
    scheduledAt: toIso(scheduledAt),
    timezone: detail?.timezone ?? null,
    durationMin: detail?.duration_min ?? null,
    status,
    paymentState: toPaymentState(detail?.payment_status ?? null),
    subtotal: toNumberOr(
      detail?.subtotal,
      items.length > 0
        ? items.reduce((sum, item) => sum + item.lineTotal, 0)
        : toNumberOr(detail?.total),
    ),
    discount: toNumberOr(detail?.discount),
    travelFee: toNumberOr(detail?.travel_fee),
    total: toNumberOr(detail?.total ?? workload.total),
    serviceNames: items.map((item) => item.serviceName).filter(Boolean),
    notes: detail?.notes ?? "",
    createdAt: toIso(detail?.created_at ?? null),
    updatedAt: toIso(detail?.updated_at ?? null),
  };
}

// bookings_by_mechanic only carries the workload columns, so a detail row
// from bookings_by_id is reshaped into the same thin workload shape the
// list path already feeds to toBookingSummary.
export function workloadFromDetail(
  mechanicId: string,
  detail: MechanicBookingRow | null,
): MechanicWorkloadRow {
  return {
    mechanic_id: mechanicId,
    scheduled_at: detail?.scheduled_at ?? null,
    booking_id: detail?.booking_id ?? "",
    status: detail?.status ?? null,
    total: detail?.total ?? null,
    vehicle_plate: detail?.vehicle_plate ?? null,
    customer_name: detail?.customer_name ?? null,
  };
}

/** Timeline entry; null when the row carries a status we do not know. */
export function toTimelineEntry(
  row: MechanicStatusHistoryRow,
): MechanicBookingTimelineEntry | null {
  const to = parseBookingStatus(row.new_status);
  if (!to) return null;
  return {
    at: toIso(row.changed_at),
    from: parseBookingStatus(row.old_status),
    to,
    note: row.note,
  };
}

/** Coerces a raw status column; null means "ignore this row". */
export function toBookingStatus(
  raw: string | null | undefined,
): MechanicBookingStatus | null {
  return parseBookingStatus(raw ?? null);
}
