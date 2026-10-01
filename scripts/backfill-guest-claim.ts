// One-off data backfill for the guest-record claim feature. The lookup
// tables only see rows created after they exist, so this scans the two
// canonical tables once and writes a lookup row for every row that is
// STILL a guest record (customer_id IS NULL) with a usable contact pair.
// CQL cannot filter on null, so the scan reads every row and filters in
// code — dev-scale tables make that cheap. Safe to re-run: INSERTs hit
// the same primary key and just overwrite themselves.
// Usage: bun run scripts/backfill-guest-claim.ts

import { normalizeEmail, normalizePhone } from "../lib/auth/validation";
import { scylla } from "../lib/db/client";

type ScanSpec = {
  label: string;
  scan: string;
  insert: string;
};

const SPECS: ScanSpec[] = [
  {
    label: "guest_bookings_by_phone",
    scan: "SELECT booking_id, customer_id, customer_phone, customer_email, created_at FROM bookings_by_id",
    insert:
      "INSERT INTO guest_bookings_by_phone (phone, booking_id, created_at, email) VALUES (?, ?, ?, ?)",
  },
  {
    label: "guest_orders_by_phone",
    scan: "SELECT order_id, customer_id, customer_phone, customer_email, created_at FROM orders_by_id",
    insert:
      "INSERT INTO guest_orders_by_phone (phone, order_id, created_at, email) VALUES (?, ?, ?, ?)",
  },
];

const PAGE_SIZE = 500;

async function backfill(spec: ScanSpec): Promise<void> {
  const idColumn = spec.label.includes("booking") ? "booking_id" : "order_id";
  let scanned = 0;
  let owned = 0;
  let noContact = 0;
  let written = 0;
  let pageState: string | undefined;

  do {
    const page = await scylla.execute(spec.scan, [], {
      fetchSize: PAGE_SIZE,
      pageState,
      prepare: false,
    });
    pageState = page.pageState ?? undefined;

    for (const row of page.rows as unknown as Record<string, unknown>[]) {
      scanned += 1;
      if (row.customer_id != null) {
        owned += 1;
        continue;
      }
      const phone = normalizePhone(String(row.customer_phone ?? ""));
      const email = normalizeEmail(String(row.customer_email ?? ""));
      if (!phone || !email) {
        noContact += 1;
        continue;
      }
      await scylla.execute(
        spec.insert,
        [
          phone,
          row[idColumn],
          (row.created_at as Date | null) ?? new Date(),
          email,
        ],
        { prepare: true },
      );
      written += 1;
    }
  } while (pageState);

  console.log(
    `  ${spec.label}: scanned ${scanned}, wrote ${written}, skipped ${owned} owned + ${noContact} without contact`,
  );
}

async function main(): Promise<number> {
  const keyspace = process.env.SCYLLA_KEYSPACE ?? "flashwrench";
  console.log(`[backfill:guest-claim] Scanning "${keyspace}"...`);
  try {
    await scylla.connect();
    for (const spec of SPECS) {
      await backfill(spec);
    }
  } catch (error) {
    console.error(
      `[backfill:guest-claim] Failed: ${error instanceof Error ? error.message : error}`,
    );
    return 1;
  } finally {
    await scylla.shutdown().catch(() => undefined);
  }
  console.log("[backfill:guest-claim] Done — no existing rows modified.");
  return 0;
}

process.exit(await main());
