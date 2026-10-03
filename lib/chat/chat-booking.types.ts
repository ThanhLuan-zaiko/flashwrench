// Booking context shown inside a chat thread. Rows come from the
// canonical booking tables; this shape is the minimal card the
// conversation header needs to keep support staff oriented.
import type { MechanicBookingRow } from "@/lib/mechanic/mechanic.types";

export type ChatBookingContext = {
  id: string;
  status: string;
  vehiclePlate: string;
  scheduledAt: string | null;
  total: number;
};

function toNumberOrZero(value: number | null): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

// Map one canonical booking row to the chat card. Unknown statuses and
// missing plates degrade to safe defaults so the card never breaks.
export function toChatBookingContext(
  row: MechanicBookingRow,
): ChatBookingContext {
  return {
    id: row.booking_id,
    status: row.status ?? "pending",
    vehiclePlate: row.vehicle_plate ?? "",
    scheduledAt: row.scheduled_at ? row.scheduled_at.toISOString() : null,
    total: toNumberOrZero(row.total),
  };
}

// Newest schedule first; rows without a date sink to the bottom.
export function sortBookingContexts(
  items: ChatBookingContext[],
): ChatBookingContext[] {
  return [...items].sort((a, b) => {
    const at = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
    const bt = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
    return bt - at;
  });
}
