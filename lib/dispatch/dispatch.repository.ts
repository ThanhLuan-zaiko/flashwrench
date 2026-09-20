import { scylla } from "@/lib/db/client";

export type StatusBookingRefRow = {
  booking_id: string;
  scheduled_at: Date | null;
};

export type StatusBookingPage = {
  rows: StatusBookingRefRow[];
  pageState: string | null;
};

function toRefRow(raw: Record<string, unknown>): StatusBookingRefRow {
  const value = raw.scheduled_at;
  const date =
    value instanceof Date ? value : value ? new Date(String(value)) : null;
  return {
    booking_id: String(raw.booking_id),
    scheduled_at: date && !Number.isNaN(date.getTime()) ? date : null,
  };
}

export async function listStatusBookingRefs(
  status: string,
  monthBucket: string,
  limit: number,
  pageState?: string | null,
): Promise<StatusBookingPage> {
  const result = await scylla.execute(
    "SELECT booking_id, scheduled_at FROM bookings_by_status WHERE status = ? AND month_bucket = ?",
    [status, monthBucket],
    {
      prepare: true,
      fetchSize: limit,
      pageState: pageState ?? undefined,
    },
  );
  const rows = result.rows as unknown as Record<string, unknown>[];
  return {
    rows: rows.map(toRefRow),
    pageState: result.pageState ?? null,
  };
}
