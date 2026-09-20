import { scylla } from "@/lib/db/client";

export type CustomerBookingRefRow = {
  scheduled_at: Date | null;
  booking_id: string;
};

export type CustomerBookingPage = {
  rows: CustomerBookingRefRow[];
  pageState: string | null;
};

function toRefRow(raw: Record<string, unknown>): CustomerBookingRefRow {
  const value = raw.scheduled_at;
  const date =
    value instanceof Date ? value : value ? new Date(String(value)) : null;
  return {
    scheduled_at: date && !Number.isNaN(date.getTime()) ? date : null,
    booking_id: String(raw.booking_id),
  };
}

export async function listCustomerBookingRefs(
  customerId: string,
  limit: number,
  pageState?: string | null,
): Promise<CustomerBookingPage> {
  const result = await scylla.execute(
    "SELECT scheduled_at, booking_id FROM bookings_by_customer WHERE customer_id = ?",
    [customerId],
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
