// Restores a backup made by scripts/db-backup.ts into the keyspace named in
// .env.local (or --keyspace <name>). Non-destructive: creates the keyspace,
// types, tables and indexes only if missing, then upserts every row. Rows
// that exist only in the target database are kept. Counter tables are set to
// the backed-up value (delta against the current value), never doubled.
// Usage: bun run db:restore <backup-file> [--keyspace <name>]
import { readFileSync } from "node:fs";
import { type Client, concurrent, types } from "cassandra-driver";
import { decodeValue, type Encoded } from "./db-backup/codec";
import {
  createClient,
  indexDdl,
  isCounterTable,
  keyColumns,
  q,
  type SchemaDef,
  type TableDef,
  tableDdl,
  typeDdl,
} from "./db-backup/schema";

type Meta = {
  kind: "meta";
  version: number;
  keyspace: string;
  schema: SchemaDef;
};
type RowLine = { kind: "row"; t: string; r: Record<string, Encoded> };

function parseArgs(): { file: string; keyspace?: string } {
  const args = process.argv.slice(2);
  const ksAt = args.indexOf("--keyspace");
  const keyspace = ksAt >= 0 ? args[ksAt + 1] : undefined;
  const file = args.find((a, i) => !a.startsWith("--") && i !== ksAt + 1);
  if (!file)
    throw new Error(
      "Usage: bun run db:restore <backup-file> [--keyspace <name>]",
    );
  return { file, keyspace };
}

async function createSchema(client: Client, ks: string, schema: SchemaDef) {
  const dc = process.env.SCYLLA_LOCAL_DATACENTER ?? "datacenter1";
  await client.execute(
    `CREATE KEYSPACE IF NOT EXISTS ${q(ks)} WITH replication = {'class': 'NetworkTopologyStrategy', '${dc}': 1} AND durable_writes = true`,
  );
  // UDTs may reference each other: retry until every type is created.
  let pending = [...schema.types];
  while (pending.length > 0) {
    const failed: typeof pending = [];
    for (const t of pending) {
      try {
        await client.execute(typeDdl(ks, t));
      } catch {
        failed.push(t);
      }
    }
    if (failed.length === pending.length) {
      throw new Error(
        `Cannot create types: ${failed.map((t) => t.name).join(", ")}`,
      );
    }
    pending = failed;
  }
  for (const t of schema.tables) await client.execute(tableDdl(ks, t));
  for (const i of schema.indexes) await client.execute(indexDdl(ks, i));
}

async function restoreRows(
  client: Client,
  ks: string,
  table: TableDef,
  rows: RowLine[],
) {
  const names = table.columns.map((c) => c.name);
  const cql = `INSERT INTO ${q(ks)}.${q(table.name)} (${names.map(q).join(", ")}) VALUES (${names.map(() => "?").join(", ")})`;
  const params = rows.map((row) =>
    names.map((n) => decodeValue(row.r[n] ?? null)),
  );
  await concurrent.executeConcurrent(client, cql, params, {
    concurrencyLevel: 64,
  });
}

async function restoreCounters(
  client: Client,
  ks: string,
  table: TableDef,
  rows: RowLine[],
) {
  const keys = keyColumns(table).map((c) => c.name);
  const counters = table.columns
    .filter((c) => c.type === "counter")
    .map((c) => c.name);
  const where = keys.map((k) => `${q(k)} = ?`).join(" AND ");
  const select = `SELECT ${counters.map(q).join(", ")} FROM ${q(ks)}.${q(table.name)} WHERE ${where}`;
  const update = `UPDATE ${q(ks)}.${q(table.name)} SET ${counters.map((c) => `${q(c)} = ${q(c)} + ?`).join(", ")} WHERE ${where}`;
  for (const row of rows) {
    const keyValues = keys.map((k) => decodeValue(row.r[k] ?? null));
    const current = (
      await client.execute(select, keyValues, { prepare: true })
    ).first();
    const deltas = counters.map((c) => {
      const want =
        (decodeValue(row.r[c] ?? null) as types.Long | undefined) ??
        types.Long.ZERO;
      const have = (current?.[c] as types.Long | null) ?? types.Long.ZERO;
      return want.subtract(have);
    });
    if (deltas.every((d) => d.isZero())) continue;
    await client.execute(update, [...deltas, ...keyValues], { prepare: true });
  }
}

async function main(): Promise<void> {
  const { file, keyspace: ksArg } = parseArgs();
  const text = new TextDecoder().decode(Bun.gunzipSync(readFileSync(file)));
  const lines = text.split("\n").filter((l) => l.length > 0);
  const meta = JSON.parse(lines[0]) as Meta;
  if (meta.kind !== "meta" || meta.version !== 1)
    throw new Error("Not a valid backup file");

  const ks = ksArg ?? process.env.SCYLLA_KEYSPACE ?? meta.keyspace;
  const byTable = new Map<string, RowLine[]>();
  for (const line of lines.slice(1)) {
    const row = JSON.parse(line) as RowLine;
    const list = byTable.get(row.t) ?? [];
    list.push(row);
    byTable.set(row.t, list);
  }

  console.log(
    `Restoring "${meta.keyspace}" (${meta.schema.tables.length} tables) into "${ks}"`,
  );
  const client = createClient();
  await client.connect();
  try {
    await createSchema(client, ks, meta.schema);
    let total = 0;
    for (const table of meta.schema.tables) {
      const rows = byTable.get(table.name) ?? [];
      if (rows.length === 0) continue;
      if (isCounterTable(table)) await restoreCounters(client, ks, table, rows);
      else await restoreRows(client, ks, table, rows);
      total += rows.length;
      console.log(`  ${table.name}: ${rows.length}`);
    }
    console.log(`Restored ${total} rows into "${ks}"`);
  } finally {
    await client.shutdown();
  }
}

main().catch((error) => {
  console.error(
    "Restore failed:",
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
});
