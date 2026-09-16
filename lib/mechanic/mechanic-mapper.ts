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
    status,
    paymentState: toPaymentState(detail?.payment_status ?? null),
    total: toNumberOr(workload.total ?? detail?.total),
    serviceNames: items.map((item) => item.serviceName).filter(Boolean),
    notes: detail?.notes ?? "",
    createdAt: toIso(detail?.created_at ?? null),
    updatedAt: toIso(detail?.updated_at ?? null),
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
