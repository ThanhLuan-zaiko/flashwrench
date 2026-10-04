import { scylla } from "../lib/db/client";

const COLUMNS = [
  { table: "bookings_by_id", column: "duration_min", type: "int" },
  { table: "booking_items", column: "duration_min", type: "int" },
  { table: "booking_items", column: "price_unit", type: "text" },
];

async function main(): Promise<number> {
  try {
    await scylla.connect();
    const keyspace = scylla.keyspace ?? process.env.SCYLLA_KEYSPACE;
    if (!keyspace) throw new Error("SCYLLA_KEYSPACE is required");
    for (const { table, column, type } of COLUMNS) {
      const existing = await scylla.execute(
        "SELECT column_name FROM system_schema.columns WHERE keyspace_name = ? AND table_name = ? AND column_name = ?",
        [keyspace, table, column],
        { prepare: true },
      );
      if (existing.first()) {
        console.log(
          `[migrate:booking-services] ${table}.${column}: already present`,
        );
        continue;
      }
      try {
        await scylla.execute(`ALTER TABLE ${table} ADD ${column} ${type}`, [], {
          prepare: false,
        });
        console.log(`[migrate:booking-services] ${table}.${column}: added`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!/already exists|conflicts with an existing column/i.test(message))
          throw error;
        console.log(
          `[migrate:booking-services] ${table}.${column}: already present`,
        );
      }
    }
    console.log(
      "[migrate:booking-services] Complete. Existing data preserved.",
    );
    return 0;
  } catch (error) {
    console.error(
      `[migrate:booking-services] Failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    return 1;
  } finally {
    await scylla.shutdown().catch(() => undefined);
  }
}

process.exit(await main());
