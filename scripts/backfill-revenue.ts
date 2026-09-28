// Backfill payments_by_period from payments_by_id for receipts that
// predate the revenue migration. Each receipt becomes one period row
// keyed by (day bucket of paid_at, paid_at, payment_id) — a repeat run
// overwrites the same primary key, so the script is safe to re-run.
// Audit events are NOT backfilled: the audit feed describes live actions,
// and historical collections would look like fake new events.
// Usage: bun run scripts/backfill-revenue.ts
import { scylla } from "../lib/db/client";
import { dayKey } from "../lib/mechanic/mechanic-period";
import type { RevenueSource } from "../lib/revenue/revenue.types";
import { REVENUE_TIME_ZONE } from "../lib/revenue/revenue-period";

const FETCH_SIZE = 500;
const REVENUE_SOURCES: RevenueSource[] = ["booking", "order", "emergency"];

type PaymentRow = {
  payment_id: string;
  ref_type: string | null;
  ref_id: string | null;
  customer_id: string | null;
  mechanic_id: string | null;
  amount: number | null;
  method: string | null;
  status: string | null;
  recorded_by: string | null;
  customer_confirmed: boolean | null;
  paid_at: Date | null;
};

function isRevenueSource(value: string | null): value is RevenueSource {
  return REVENUE_SOURCES.includes(value as RevenueSource);
}

// Receipts written before the mechanic_id column existed need the owner
// resolved from the booking/rescue row; orders have no collector.
const mechanicCache = new Map<string, string | null>();

async function resolveMechanicId(row: PaymentRow): Promise<string | null> {
  if (row.mechanic_id) return row.mechanic_id;
  if (!row.ref_id || row.ref_type === "order") return null;
  const cacheKey = `${row.ref_type}:${row.ref_id}`;
  if (mechanicCache.has(cacheKey)) return mechanicCache.get(cacheKey) ?? null;

  let mechanicId: string | null = null;
  if (row.ref_type === "booking") {
    const result = await scylla.execute(
      "SELECT mechanic_id FROM bookings_by_id WHERE booking_id = ?",
      [row.ref_id],
      { prepare: true },
    );
    mechanicId = result.first()?.mechanic_id ?? null;
  } else if (row.ref_type === "emergency") {
    const result = await scylla.execute(
      "SELECT assigned_mechanic_id FROM emergency_by_id WHERE request_id = ?",
      [row.ref_id],
      { prepare: true },
    );
    mechanicId = result.first()?.assigned_mechanic_id ?? null;
  }
  mechanicCache.set(cacheKey, mechanicId);
  return mechanicId;
}

async function main(): Promise<number> {
  console.log(
    "[backfill:revenue] Scanning payments_by_id for settled receipts...",
  );
  let scanned = 0;
  let projected = 0;
  let skipped = 0;
  let pageState: string | undefined;

  try {
    await scylla.connect();
    do {
      const result = await scylla.execute(
        `SELECT payment_id, ref_type, ref_id, customer_id, mechanic_id,
                amount, method, status, recorded_by, customer_confirmed, paid_at
         FROM payments_by_id`,
        [],
        { fetchSize: FETCH_SIZE, pageState, prepare: false },
      );
      for (const row of result.rows as unknown as PaymentRow[]) {
        scanned += 1;
        if (
          !isRevenueSource(row.ref_type) ||
          !row.ref_id ||
          !(row.paid_at instanceof Date) ||
          !row.status
        ) {
          skipped += 1;
          continue;
        }
        const mechanicId = await resolveMechanicId(row);
        await scylla.execute(
          `INSERT INTO payments_by_period
             (bucket, paid_at, payment_id, ref_type, ref_id, customer_id,
              mechanic_id, amount, method, status, recorded_by,
              customer_confirmed)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            dayKey(row.paid_at, REVENUE_TIME_ZONE),
            row.paid_at,
            row.payment_id,
            row.ref_type,
            row.ref_id,
            row.customer_id,
            mechanicId,
            row.amount ?? 0,
            row.method,
            row.status,
            row.recorded_by,
            row.customer_confirmed,
          ],
          { prepare: true },
        );
        projected += 1;
      }
      pageState = result.pageState;
      console.log(
        `[backfill:revenue] scanned=${scanned} projected=${projected} skipped=${skipped}`,
      );
    } while (pageState);
  } catch (error) {
    console.error(
      `[backfill:revenue] Failed: ${error instanceof Error ? error.message : error}`,
    );
    return 1;
  } finally {
    await scylla.shutdown().catch(() => undefined);
  }

  console.log(
    `[backfill:revenue] Done — ${projected} receipts projected, ${skipped} rows skipped of ${scanned}.`,
  );
  return 0;
}

process.exit(await main());
